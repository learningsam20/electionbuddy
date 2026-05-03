# ============================================================
# ElectionBuddy — Multi-Stage Production Dockerfile
# Stage 1: Build React/Vite frontend
# Stage 2: Compile Python wheels
# Stage 3: Lean production image (FastAPI serves built React)
# ============================================================

# --------------- Stage 1: Frontend Build ---------------
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy dependency manifests first for layer caching
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
# VITE_API_BASE_URL must be set at build time (or via .env.production)
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# --------------- Stage 2: Python Wheel Builder ---------------
FROM python:3.12-slim AS backend-builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt

# --------------- Stage 3: Final Production Image ---------------
FROM python:3.12-slim AS production

WORKDIR /app

# Install wheels from builder stage (no internet needed)
COPY --from=backend-builder /build/wheels /wheels
COPY --from=backend-builder /build/requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt

# Copy application code
COPY backend/ /app/backend/
COPY data/     /app/data/

# Copy the built React SPA into the static directory that FastAPI serves
COPY --from=frontend-builder /frontend/dist /app/backend/static

# Runtime environment defaults (override via docker run -e or docker-compose)
ENV PYTHONUNBUFFERED=1 \
    PORT=8573 \
    APP_ENV=production \
    DATABASE_URL=sqlite:///./data/election.db

EXPOSE 8573

# Use 2 workers; set LOAD_DEMO_DATA=1 to seed on first boot
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8573", "--workers", "2"]
