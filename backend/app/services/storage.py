import base64
import os
from datetime import datetime
from io import BytesIO

from PIL import Image

from app.core.config import settings
from app.schemas.form_payload import PhotoPayload


def save_photos(id_usuario: str, id_formulario: str, fotos: list[PhotoPayload], fecha_hora: datetime) -> list[str]:
    date_path = fecha_hora.strftime("%Y/%m/%d")
    base_path = os.path.join(settings.upload_root, date_path, id_usuario, id_formulario)
    os.makedirs(base_path, exist_ok=True)

    saved_files: list[str] = []
    for idx, foto in enumerate(fotos, start=1):
        header, _, data = foto.data.partition("base64,")
        if not data:
            raise ValueError("invalid_photo_payload")

        raw = base64.b64decode(data)
        image = Image.open(BytesIO(raw))
        image.verify()

        extension = "webp" if "webp" in header else "jpg"
        filename = f"foto_{idx}.{extension}"
        file_path = os.path.join(base_path, filename)

        with open(file_path, "wb") as handler:
            handler.write(raw)

        saved_files.append(file_path)

    return saved_files
