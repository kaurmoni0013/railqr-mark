from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import TrackFitting
from app.schemas.schemas import TrackFittingDetail
import base64
import io

router = APIRouter(prefix="/api/camera", tags=["Camera Scan"])

class CameraScanRequest(BaseModel):
    image_base64: str

class CameraScanResponse(BaseModel):
    success: bool
    qr_data: str | None = None
    fitting_id: int | None = None
    fitting_code: str | None = None
    message: str = ""

@router.post("/scan-qr", response_model=CameraScanResponse)
def scan_qr_from_camera(request: CameraScanRequest, db: Session = Depends(get_db)):
    try:
        image_bytes = base64.b64decode(request.image_base64)

        # Try pyzbar first
        try:
            from pyzbar.pyzbar import decode
            from PIL import Image
            image = Image.open(io.BytesIO(image_bytes))
            decoded_objects = decode(image)

            if decoded_objects:
                qr_data = decoded_objects[0].data.decode("utf-8")
                return _lookup_qr(qr_data, db)
        except ImportError:
            pass

        # Fallback to OpenCV
        try:
            import cv2
            import numpy as np
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            detector = cv2.QRCodeDetector()
            data, _, _ = detector.detectAndDecode(img)

            if data:
                return _lookup_qr(data, db)
        except ImportError:
            pass

        return CameraScanResponse(success=False, message="No QR code detected in the image. Please try again.")
    except Exception as e:
        return CameraScanResponse(success=False, message=f"Scan error: {str(e)}")


def _lookup_qr(qr_data: str, db: Session) -> CameraScanResponse:
    """Look up a fitting by QR data string."""
    # Try parsing QR data format: RAILSAATHI:FITTING_CODE:V1 or RAILQR:FITTING_CODE:V1
    fitting_code = None
    for prefix in ["RAILSAATHI:", "RAILQR:"]:
        if qr_data.startswith(prefix):
            parts = qr_data.split(":")
            if len(parts) >= 2:
                fitting_code = parts[1]
            break

    if not fitting_code:
        fitting_code = qr_data

    # Search by fitting_code
    fitting = db.query(TrackFitting).filter(TrackFitting.fitting_code == fitting_code).first()
    if not fitting:
        # Try by ID
        try:
            fitting_id = int(fitting_code.replace("FIT-", "").replace("#", ""))
            fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
        except (ValueError, TypeError):
            pass

    if fitting:
        return CameraScanResponse(
            success=True,
            qr_data=qr_data,
            fitting_id=fitting.id,
            fitting_code=fitting.fitting_code,
            message=f"Fitting found: {fitting.fitting_code} (Status: {fitting.status}, Health: {fitting.health_score})"
        )

    return CameraScanResponse(success=False, qr_data=qr_data, message="QR code scanned but no matching fitting found in database.")
