# Diagnostico: "Enviar" no hace nada

## Observacion reportada

- Al presionar "Guardar / enviar" no ocurre ninguna accion visible.

## Intentos de solucion aplicados

1. Se simplifico el handler del formulario para que use directamente `handleSubmit(onValid, onInvalid)` sin `setTimeout` ni `preventDefault` manual.
   - Motivo: el wrapper con `setTimeout` puede bloquear o no disparar el handler en algunos navegadores/dispositivos.
   - Cambio: [frontend/src/pages/FormularioPage.tsx](frontend/src/pages/FormularioPage.tsx)
2. Se movio el detalle de validaciones fallidas al bloque sticky del boton para que sea visible al final del formulario.
   - Motivo: el usuario solo veia el mensaje general y no el detalle del error, lo que impide saber si falta GPS o fotos.
   - Cambio: [frontend/src/pages/FormularioPage.tsx](frontend/src/pages/FormularioPage.tsx)
3. Se agrego fallback con codigos de validacion (`gps_precision`, `fotos_count`) cuando el detalle humano queda vacio.
   - Motivo: identificar exactamente la causa del bloqueo incluso si el mensaje formateado falla.
   - Cambio: [frontend/src/pages/FormularioPage.tsx](frontend/src/pages/FormularioPage.tsx)
4. Se agrego validacion explicita del conteo de fotos con mensaje incluyendo el numero actual.
   - Motivo: el bloqueo actual indica fotos insuficientes; necesitamos visibilidad inmediata del conteo cargado.
   - Cambio: [frontend/src/pages/FormularioPage.tsx](frontend/src/pages/FormularioPage.tsx)
5. Se alinea la validacion del frontend con el backend: GPS <= 3m y campos obligatorios completos antes de enviar.
   - Motivo: el backend responde 422 cuando faltan campos o la precision GPS excede 3m; bloquear antes evita fallos de sync.
   - Cambios: [frontend/src/services/sync.ts](frontend/src/services/sync.ts), [frontend/src/services/api.ts](frontend/src/services/api.ts), [frontend/src/hooks/useGPS.ts](frontend/src/hooks/useGPS.ts)
6. Modo pruebas: se sube el umbral de GPS a 100m y se elimina el minimo de fotos.
   - Motivo: permitir pruebas rapidas sin esperar precision ni cargar imagenes.
   - Cambios: [frontend/src/hooks/useGPS.ts](frontend/src/hooks/useGPS.ts), [frontend/src/services/sync.ts](frontend/src/services/sync.ts), [frontend/src/pages/FormularioPage.tsx](frontend/src/pages/FormularioPage.tsx)

## Hipotesis en revision (si el problema persiste)

- La validacion de GPS/fotos podría cortar el flujo sin mostrar feedback (ver `submitFeedback` y `banner`).
- El envio local falla por error de IndexedDB/Dexie (ver errores en consola del navegador).
- `react-hook-form` no llega a ejecutar `onValid` debido a errores no visibles.
- El flujo de autenticacion bloquea el post (token ausente o invalido).

## Proximo paso sugerido

- Confirmar si el mensaje `submitFeedback` cambia al presionar "Guardar / enviar".
- Revisar consola del navegador para errores Javascript o fallos de IndexedDB.
