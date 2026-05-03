# Combined Dockerfile for React Frontend + FastAPI Backend

# Stage 1: Build React Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build the Vite project into /frontend/dist
RUN npm run build

# Stage 2: Build Python Backend
FROM python:3.13-slim as backend-builder
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Stage 3: Final Production Image
FROM python:3.13-slim
WORKDIR /app

COPY --from=backend-builder /app/wheels /wheels
COPY --from=backend-builder /app/requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt

# Copy FastAPI backend code
COPY ./backend /app/backend
COPY ./data /app/data

# Copy built React files into a static directory inside backend
COPY --from=frontend-builder /frontend/dist /app/backend/static

# Set Environment Variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8573

EXPOSE 8573

# Run Uvicorn Server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8573", "--workers", "2"]
