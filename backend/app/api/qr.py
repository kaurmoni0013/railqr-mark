import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.models import TrackFitting, QRCode
from app.schemas.schemas import (
    QRGenerateRequest, QRGenerateResponse, QRVerifyRequest,
    QRVerifyResponse, QRInfoRead
)
from app.services.qr_service import generate_qr_code, verify_qr, save_qr_image

router = APIRouter(prefix="/api/qr", tags=["QR Codes"])


@router.post("/generate", response_model=QRGenerateResponse)
def generate_qr(data: QRGenerateRequest, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == data.fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    existing_qr = db.query(QRCode).filter(
        QRCode.fitting_id == data.fitting_id, QRCode.is_active == True
    ).first()

    image_bytes, base64_str, qr_data = generate_qr_code(fitting.fitting_code)
    image_path = save_qr_image(image_bytes, fitting.fitting_code, settings.QR_IMAGE_DIR)

    if existing_qr:
        existing_qr.is_active = False
        db.commit()

    new_qr = QRCode(
        fitting_id=data.fitting_id,
        qr_data=qr_data,
        qr_image_path=image_path,
        version=(existing_qr.version + 1) if existing_qr else 1,
        is_active=True,
    )
    db.add(new_qr)
    db.commit()
    db.refresh(new_qr)

    return QRGenerateResponse(
        fitting_id=fitting.id,
        fitting_code=fitting.fitting_code,
        qr_data=qr_data,
        qr_image_base64=base64_str,
        qr_image_path=image_path,
        version=new_qr.version,
    )


@router.post("/verify", response_model=QRVerifyResponse)
def verify_qr_code(data: QRVerifyRequest, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting_code = verify_qr(data.qr_data)
    if not fitting_code:
        return QRVerifyResponse(valid=False, fitting_code=None, fitting_id=None)

    fitting = db.query(TrackFitting).filter(TrackFitting.fitting_code == fitting_code).first()
    if not fitting:
        return QRVerifyResponse(valid=False, fitting_code=fitting_code, fitting_id=None)

    return QRVerifyResponse(valid=True, fitting_code=fitting_code, fitting_id=fitting.id)


@router.get("/{fitting_id}", response_model=QRInfoRead)
def get_qr_info(fitting_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    qr = db.query(QRCode).filter(
        QRCode.fitting_id == fitting_id, QRCode.is_active == True
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="No active QR code found for this fitting")

    return QRInfoRead.model_validate(qr)
