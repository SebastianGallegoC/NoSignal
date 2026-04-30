from datetime import datetime

from geoalchemy2 import WKTElement
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.form_record import FormRecord
from app.repository.forms import create_form, get_form_by_id
from app.schemas.form_payload import FormPayload
from app.services.storage import save_photos


def parse_fecha_hora_iso(value: str) -> datetime:
    """ISO 8601 desde el cliente (p. ej. toISOString() con 'Z'); compatible con Python < 3.11."""
    s = value.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)


async def persist_form(session: AsyncSession, payload: FormPayload) -> FormRecord:
    existing = await get_form_by_id(session, payload.id_formulario)
    if existing:
        return existing

    fecha_hora = parse_fecha_hora_iso(payload.fecha_hora)
    fotos = (
        save_photos(payload.id_usuario, payload.id_formulario, payload.fotos, fecha_hora)
        if payload.fotos
        else []
    )

    gps_point = WKTElement(f"POINT({payload.gps.longitud} {payload.gps.latitud})", srid=4326)

    record = FormRecord(
        id_formulario=payload.id_formulario,
        id_usuario=payload.id_usuario,
        fecha_hora=fecha_hora,
        gps=gps_point,
        datos_formulario=payload.datos_formulario,
        fotos=fotos,
    )

    return await create_form(session, record)
