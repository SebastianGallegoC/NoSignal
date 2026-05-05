from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.schemas.form_payload import FormPayload, GPSPayload
from app.services.forms import persist_form


@pytest.mark.asyncio
async def test_persist_form_updates_datos_when_id_exists(monkeypatch):
    existing = SimpleNamespace(
        id_formulario="f-upd",
        id_usuario="u-old",
        fecha_hora=datetime(2026, 1, 1, tzinfo=timezone.utc),
        gps=None,
        datos_formulario={"nombres_apellidos_beneficiario": "Viejo"},
        fotos=[],
    )

    async def fake_get(_session, form_id):
        return existing if form_id == "f-upd" else None

    monkeypatch.setattr("app.services.forms.get_form_by_id", fake_get)

    session = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    payload = FormPayload(
        id_formulario="f-upd",
        id_usuario="u-new",
        fecha_hora="2026-05-04T12:00:00Z",
        gps=GPSPayload(latitud=1.0, longitud=-2.0, precision=5.0),
        datos_formulario={"nombres_apellidos_beneficiario": "Nuevo"},
        fotos=[],
    )

    result = await persist_form(session, payload)

    assert result is existing
    assert existing.datos_formulario["nombres_apellidos_beneficiario"] == "Nuevo"
    assert existing.id_usuario == "u-new"
    session.commit.assert_awaited_once()
    session.refresh.assert_awaited_once()
