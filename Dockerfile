# Imagen para desplegar ProspectOS en un servidor compartido (Railway y afines).
#
# El canal Google Maps por scraper local (.exe de Windows + Playwright) NO
# funciona acá - en la nube hay que usar la Google Places API oficial
# (Configuración -> Fuente de datos -> Google Places API). El canal Instagram
# sí funciona igual (instagrapi es Python puro).

# --- etapa 1: build del frontend (Vite) ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- etapa 2: backend (Flask/waitress) sirviendo el build del frontend ---
FROM python:3.12-slim
WORKDIR /app/backend

# dependencias de sistema para paquetes con extensiones nativas (cryptography,
# Pillow via instagrapi) que no siempre tienen wheel prearmado para esta imagen
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

ENV PYTHONUNBUFFERED=1

# Railway inyecta $PORT en tiempo de ejecución - app.py lo lee solo y hace
# bind en 0.0.0.0 cuando detecta esa variable (ver MODO_NUVEM en app.py)
CMD ["python", "app.py"]
