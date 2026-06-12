# MediCitas — Sistema de Gestión de Citas Médicas

Proyecto académico individual. Frontend en React, backend en NestJS, PostgreSQL.

## Estructura

- `backend/` — API REST (NestJS + TypeORM)
- `frontend/` — SPA (React + Vite + Material UI)
- `k8s/` — manifiestos Kubernetes (Fase 4)
- `docs/` — diseño y planes

## Desarrollo

1. Base de datos: `docker compose up -d db`
2. Backend: `cd backend && npm install && npm run start:dev` (http://localhost:3000/api)
3. Frontend: `cd frontend && npm install && npm run dev` (http://localhost:5173)

Usuario inicial: ver variables `ADMIN_*` en `backend/.env.example`.

> Nota: el usuario administrador se crea solo en el **primer arranque** (seed). Cambiar `ADMIN_PASSWORD` después no actualiza la contraseña de un admin ya creado.
