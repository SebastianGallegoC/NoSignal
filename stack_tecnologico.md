# Stack Tecnológico: Aplicación de Recolección de Datos Offline-First

## 1. Frontend (Mobile First - PWA)
- **Framework:** React.js con **Vite** (para una configuración rápida de PWA).
- **Estilos:** Tailwind CSS (diseño responsivo y amigable para pulgares en móviles).
- **Manejo de Estado y Persistencia Local:** - **Dexie.js:** Wrapper de **IndexedDB** para almacenamiento de formularios y archivos (Blobs) de forma asíncrona.
    - **Context API / Zustand:** Para el estado global de la sesión.
- **Capacidades PWA:**
    - **Vite PWA Plugin:** Gestión de Service Workers.
    - **Workbox Background Sync:** Para reintentar el envío de datos automáticamente cuando se recupere la conexión.

## 2. Backend (API & Procesamiento)
- **Framework:** **FastAPI (Python)**.
- **Validación de Datos:** Pydantic models (deben coincidir con el esquema de Dexie.js).
- **Autenticación:** JWT (JSON Web Tokens) con manejo de expiración.
- **Procesamiento de Imágenes:** Pillow (para validación opcional en servidor).

## 3. Infraestructura y Almacenamiento
- **Base de Datos:** **PostgreSQL** con extensión **PostGIS** (para almacenamiento eficiente de coordenadas GPS).
- **Almacenamiento de Archivos:** Sistema de archivos del servidor (Docker Volumes) con rutas indexadas en la DB.
- **Contenerización:** **Docker & Docker Compose** (un contenedor para la API, uno para la DB y uno para Nginx).
- **Servidor Web:** Nginx (como Proxy Inverso) con Certbot para **HTTPS obligatorio**.

## 4. Utilidades Críticas
- **Geolocalización:** HTML5 Geolocation API (Modo `highAccuracy`).
- **Compresión de Imágenes:** `browser-image-compression` (ejecutado en el cliente antes de guardar en IndexedDB).