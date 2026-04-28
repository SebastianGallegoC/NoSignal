from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.form_record import FormRecord


async def get_form_by_id(session: AsyncSession, form_id: str) -> FormRecord | None:
    result = await session.execute(select(FormRecord).where(FormRecord.id_formulario == form_id))
    return result.scalars().first()


async def create_form(session: AsyncSession, record: FormRecord) -> FormRecord:
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record
