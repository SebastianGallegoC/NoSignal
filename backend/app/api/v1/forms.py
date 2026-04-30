import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.schemas.form_payload import FormPayload
from app.services.forms import persist_form

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/")
async def create_form(
    payload: FormPayload,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    session: AsyncSession = Depends(get_session),
    _current_user: str = Depends(get_current_user),
):
    if idempotency_key and idempotency_key != payload.id_formulario:
        raise HTTPException(status_code=409, detail="idempotency_key_mismatch")

    try:
        record = await persist_form(session, payload)
    except ValueError as exc:
        # Errores tras validar el JSON (fotos, fecha_hora, etc.); no pasan por RequestValidationError.
        logger.warning("422 persist_form: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"status": "queued", "id_formulario": record.id_formulario}
