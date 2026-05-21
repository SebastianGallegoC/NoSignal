"""strip DMS keys from datos_formulario JSON

Revision ID: 20260519_0001
Revises: 20260505_0001
Create Date: 2026-05-19 00:00:00
"""

from __future__ import annotations

from alembic import op

revision = "20260519_0001"
down_revision = "20260505_0001"
branch_labels = None
depends_on = None

GMS_KEYS_SQL = (
    " - 'x_grados' - 'x_minutos' - 'x_segundos'"
    " - 'y_grados' - 'y_minutos' - 'y_segundos'"
)


def upgrade() -> None:
    op.execute(
        f"UPDATE forms SET datos_formulario = datos_formulario{GMS_KEYS_SQL}"
    )


def downgrade() -> None:
    pass
