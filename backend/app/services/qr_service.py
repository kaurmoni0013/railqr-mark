import os
import io
import qrcode
import qrcode.image.svg
import base64
from typing import Tuple, Optional

QR_PREFIX = "RAILQR"
QR_VERSION = "V1"
QR_SEPARATOR = ":"


def generate_qr_code(fitting_code: str) -> Tuple[bytes, str, str]:
    qr_data = f"{QR_PREFIX}{QR_SEPARATOR}{fitting_code}{QR_SEPARATOR}{QR_VERSION}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    image_bytes = buffer.getvalue()
    buffer.seek(0)
    base64_str = base64.b64encode(image_bytes).decode("utf-8")

    return image_bytes, base64_str, qr_data


def verify_qr(qr_data: str) -> Optional[str]:
    if not qr_data:
        return None
    parts = qr_data.split(QR_SEPARATOR)
    if len(parts) == 3 and parts[0] == QR_PREFIX and parts[2] == QR_VERSION:
        return parts[1]
    return None


def save_qr_image(image_bytes: bytes, fitting_code: str, directory: str = "static/qr") -> str:
    os.makedirs(directory, exist_ok=True)
    filename = f"qr_{fitting_code}.png"
    filepath = os.path.join(directory, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)
    return filepath
