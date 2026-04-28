from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_GPS_ACCURACY_METERS = 3

REQUIRED_FORM_FIELDS = [
    "entidad_aportante",
    "tipo_organizacion_entidad_aportante",
    "nombre_actividad",
    "fecha_inicio",
    "fecha_fin",
    "tipo_proyecto_financiacion",
    "nombres_apellidos_beneficiario",
    "edad",
    "genero",
    "tipo_documento",
    "numero_documento",
    "telefono",
    "usuario_cens",
    "estado_factura",
    "departamento",
    "municipio",
    "vereda",
    "direccion",
    "zona",
    "estrato",
    "sisben",
    "nivel_ingreso_promedio",
    "nombre_predio",
    "residencia",
    "tenencia_predio",
    "x_grados",
    "x_minutos",
    "x_segundos",
    "longitud",
    "y_grados",
    "y_minutos",
    "y_segundos",
    "latitud",
    "numero_personas_nucleo_familiar",
    "numero_menores_edad",
    "numero_adultos_mayores",
    "mujer_cabeza_hogar",
    "persona_discapacidad",
    "ocupacion_principal",
    "perfil_social_priorizado",
    "area_huerta_m2",
    "tipo_espacio_huerta",
    "acceso_agua",
    "tipo_riego",
    "exposicion_solar_adecuada",
    "suelo_o_recipientes",
    "disponibilidad_mantenimiento",
    "area_arbol_disponible",
    "tipo_suelo",
    "distancia_infraestructura_adecuada",
    "distancia_redes_electricas_adecuada",
    "interes_autoconsumo",
    "interes_comercializacion",
    "asistencia_capacitaciones",
    "permite_visitas",
    "compromiso_cuidado_arbol",
    "firma_acuerdo",
    "autoriza_tratamiento_datos",
    "autoriza_registros_fotograficos",
    "cumple_criterios_huerta",
    "cumple_criterios_arbol",
    "observaciones",
    "fecha_visita_1",
    "fecha_visita_2",
    "fecha_visita_3",
    "estado_huerta_final",
    "estado_arbol_final",
    "produccion_kg",
    "satisfaccion_1_5",
    "especies_flora_fauna",
    "ecosistema_estrategico",
    "tipo_cobertura",
    "cercania_ronda_hidrica",
    "superficie_total_intervenida_m2",
    "total_especies_semillas_sembradas",
]


def _is_empty_value(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


TRI_FIELDS = [
    "mujer_cabeza_hogar",
    "persona_discapacidad",
    "exposicion_solar_adecuada",
    "interes_autoconsumo",
    "interes_comercializacion",
    "asistencia_capacitaciones",
    "permite_visitas",
    "compromiso_cuidado_arbol",
    "firma_acuerdo",
    "autoriza_tratamiento_datos",
    "autoriza_registros_fotograficos",
    "cumple_criterios_huerta",
    "cumple_criterios_arbol",
    "distancia_infraestructura_adecuada",
    "distancia_redes_electricas_adecuada",
    "cercania_ronda_hidrica",
]

TRI_VALUES = {"Si", "No", "NR"}


def _to_float(value: Any) -> float | None:
    if isinstance(value, (float, int)):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            return float(value)
        except ValueError:
            return None
    return None


class GPSPayload(BaseModel):
    latitud: float
    longitud: float
    precision: float = Field(gt=0)

    @field_validator("precision")
    @classmethod
    def validate_precision(cls, value: float) -> float:
        if value > MAX_GPS_ACCURACY_METERS:
            raise ValueError("gps_precision_exceeded")
        return value


class PhotoPayload(BaseModel):
    nombre_archivo: str
    data: str

    @field_validator("data")
    @classmethod
    def validate_data(cls, value: str) -> str:
        if not value.startswith("data:image/"):
            raise ValueError("invalid_image_payload")
        return value


class FormPayload(BaseModel):
    id_formulario: str
    id_usuario: str = Field(min_length=3, max_length=64)
    fecha_hora: str
    gps: GPSPayload
    datos_formulario: Dict[str, Any]
    fotos: List[PhotoPayload]

    @field_validator("id_usuario")
    @classmethod
    def validate_id_usuario(cls, value: str) -> str:
        allowed = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-")
        if any(ch not in allowed for ch in value):
            raise ValueError("invalid_id_usuario")
        return value

    @field_validator("fotos")
    @classmethod
    def validate_photos(cls, fotos: List[PhotoPayload]) -> List[PhotoPayload]:
        if len(fotos) < 3 or len(fotos) > 15:
            raise ValueError("photos_out_of_range")
        return fotos

    @model_validator(mode="after")
    def validate_required_fields(self) -> "FormPayload":
        missing = [
            field
            for field in REQUIRED_FORM_FIELDS
            if _is_empty_value(self.datos_formulario.get(field))
        ]
        if missing:
            raise ValueError("missing_required_fields")

        edad = _to_float(self.datos_formulario.get("edad"))
        if edad is None or edad < 0 or edad > 120:
            raise ValueError("edad_out_of_range")

        satisfaccion = _to_float(self.datos_formulario.get("satisfaccion_1_5"))
        if satisfaccion is None or satisfaccion < 1 or satisfaccion > 5:
            raise ValueError("satisfaccion_out_of_range")

        telefono = str(self.datos_formulario.get("telefono", "")).strip()
        allowed_phone = set("0123456789+- ()")
        if len(telefono) < 7 or len(telefono) > 20 or any(ch not in allowed_phone for ch in telefono):
            raise ValueError("telefono_invalid")

        for field in TRI_FIELDS:
            raw = str(self.datos_formulario.get(field, "")).strip()
            if raw not in TRI_VALUES:
                raise ValueError(f"invalid_tri_value_{field}")

        try:
            fecha1 = self.datos_formulario["fecha_visita_1"]
            fecha2 = self.datos_formulario["fecha_visita_2"]
            fecha3 = self.datos_formulario["fecha_visita_3"]
            ts1 = datetime.fromisoformat(str(fecha1)).timestamp()
            ts2 = datetime.fromisoformat(str(fecha2)).timestamp()
            ts3 = datetime.fromisoformat(str(fecha3)).timestamp()
            if not (ts1 <= ts2 <= ts3):
                raise ValueError("invalid_visit_date_order")
        except Exception as exc:
            if isinstance(exc, ValueError) and str(exc) == "invalid_visit_date_order":
                raise
            raise ValueError("invalid_visit_dates") from exc

        return self
