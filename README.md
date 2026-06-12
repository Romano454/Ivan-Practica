# MediCitas — Sistema de Gestión de Citas Médicas

Proyecto académico individual: aplicación web para que un consultorio médico/odontológico
administre pacientes, doctores y citas, con reportes en PDF, estadísticas, autenticación
con CAPTCHA, permisos por rol y auditoría de accesos.

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Material UI + Recharts |
| Backend | NestJS + TypeORM + JWT + bcrypt + pdfmake |
| Base de datos | PostgreSQL |
| Infraestructura | Docker, docker-compose, Kubernetes |

## Funcionalidades

- Login con JWT + **Google reCAPTCHA v2** y registro con **medidor de fuerza de contraseña**
  (débil/intermedia/fuerte, las débiles se rechazan; hash con bcrypt).
- Roles **ADMIN** y **RECEPCIONISTA** con permisos diferenciados (guards globales).
- CRUD de **pacientes, doctores, citas y usuarios** con **eliminación lógica**
  (`deleted_at`; los usuarios eliminados pueden restaurarse).
- Validaciones en frontend (zod) y backend (class-validator).
- **Log de accesos**: usuario, IP, evento (INGRESO/SALIDA), navegador, fecha y hora.
- **Reporte PDF** de citas por rango de fechas y doctor (pdfmake).
- **Dashboard** con gráficos estadísticos (citas por mes, por estado y por doctor).

## Estructura

- `backend/` — API REST (NestJS + TypeORM)
- `frontend/` — SPA (React + Vite + Material UI)
- `k8s/` — manifiestos Kubernetes
- `docs/` — diseño y planes de implementación

## Desarrollo local

1. Base de datos: `docker compose up -d db` (queda en el puerto **5433** del host)
2. Backend: `cd backend && npm install && cp .env.example .env && npm run start:dev` → http://localhost:3000/api
3. Frontend: `cd frontend && npm install && cp .env.example .env && npm run dev` → http://localhost:5173

Usuario inicial: `admin@medicitas.com` / `Admin#2026!` (variables `ADMIN_*` del `.env`).

> El usuario administrador se crea solo en el **primer arranque** (seed). Cambiar
> `ADMIN_PASSWORD` después no actualiza la contraseña de un admin ya creado.
> En desarrollo se usan las claves de **prueba** de reCAPTCHA (siempre validan).

Tests del backend: `cd backend && npm test`

## Docker (aplicación completa)

```bash
docker compose up -d --build
```

- Frontend: http://localhost:8080 (nginx, hace proxy de `/api` al backend)
- Backend: http://localhost:3000/api
- PostgreSQL: puerto 5433 del host

## Kubernetes

Con un clúster local (Docker Desktop con Kubernetes habilitado, o minikube):

```bash
# 1. Construir las imágenes locales
docker build -t medicitas-backend:latest ./backend
docker build -t medicitas-frontend:latest ./frontend
# (con minikube: ejecutar antes `minikube image load` para cada imagen)

# 2. Aplicar los manifiestos
kubectl apply -f k8s/

# 3. Verificar
kubectl get pods -n medicitas

# 4. Acceder sin ingress (port-forward)
kubectl port-forward -n medicitas service/frontend 8081:80
# → http://localhost:8081
```

Los manifiestos incluyen: Namespace, Secret, ConfigMap, PostgreSQL con volumen
persistente (PVC), Deployments + Services de backend y frontend, e Ingress
(`medicitas.local`, requiere ingress-nginx).

## Despliegue gratuito en producción

Arquitectura: **Vercel** (frontend) + **Render** (backend) + **Neon** (PostgreSQL).

### 1. Base de datos en Neon (https://neon.tech)

1. Crear proyecto gratuito → copiar la cadena de conexión `postgresql://...`.

### 2. Claves reales de reCAPTCHA (https://www.google.com/recaptcha/admin)

1. Registrar el sitio (tipo **v2 "No soy un robot"**) con el dominio de Vercel.
2. Guardar la **site key** (frontend) y la **secret key** (backend).

### 3. Backend en Render (https://render.com)

1. New → Web Service → conectar este repositorio (Render detecta `render.yaml`).
2. Completar las variables: `DATABASE_URL` (Neon), `RECAPTCHA_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `FRONTEND_URL` (la URL de Vercel).
3. Copiar la URL del servicio, p. ej. `https://medicitas-backend.onrender.com`.

> El plan gratuito de Render "duerme" tras 15 min sin tráfico; la primera
> petición posterior tarda ~30 s.

### 4. Frontend en Vercel (https://vercel.com)

1. New Project → importar este repositorio → **Root Directory: `frontend`**.
2. Variables de entorno:
   - `VITE_API_URL` = `https://medicitas-backend.onrender.com/api`
   - `VITE_RECAPTCHA_SITE_KEY` = site key real de reCAPTCHA
3. Deploy. La URL resultante es la aplicación pública.
