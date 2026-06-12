# Diseño: MediCitas — Sistema de Gestión de Citas Médicas

**Fecha:** 2026-06-12
**Tipo:** Proyecto académico individual (entrega por partes)
**Estado:** Aprobado

## 1. Objetivo

Aplicación web para que un consultorio médico/odontológico administre sus pacientes,
doctores y citas, con reportes en PDF, estadísticas, control de acceso por roles y
registro de auditoría de accesos. Pensada para ser usada por una recepcionista real.

## 2. Requisitos de la consigna y cómo se cumplen

| Requisito | Cumplimiento |
|---|---|
| Objetivo bien definido | Gestión de citas médicas/odontológicas |
| Menú | Menú lateral con 8 secciones (ver §7) |
| CRUD con eliminación lógica | 4 CRUDs (pacientes, doctores, citas, usuarios) con `deleted_at` vía `@DeleteDateColumn` de TypeORM |
| Frontend React | React 18 + Vite + TypeScript + Material UI |
| Backend NestJS | NestJS 10 + TypeORM + PostgreSQL |
| Validaciones de entrada | Frontend: react-hook-form + zod. Backend: class-validator + ValidationPipe global |
| Reporte PDF | Citas por rango de fechas y por doctor, generado en backend con pdfmake |
| Gráfico estadístico | Dashboard con Recharts: citas por mes, por doctor y por estado |
| Login + permisos + CAPTCHA | JWT + guards por rol + Google reCAPTCHA v2 verificado en backend |
| Fuerza de contraseña + encriptación | zxcvbn (débil/intermedio/fuerte) en registro; rechazo de débiles en backend; hash bcrypt |
| Log de acceso | Tabla `access_logs`: usuario, IP, evento (INGRESO/SALIDA), navegador, fecha y hora |
| GitHub | Monorepo único, enlace para entrega |
| Despliegue gratuito | Vercel (frontend) + Render (backend) + Neon (PostgreSQL) |
| Docker | Dockerfile por servicio + docker-compose con PostgreSQL |
| Kubernetes | Manifiestos en `/k8s` (deployments, services, configmap, secret, ingress), demo con Docker Desktop/minikube |
| Móvil (opcional) | PWA instalable con vite-plugin-pwa |
| Agente inteligente (opcional) | Chatbot con API de Claude que responde sobre citas y disponibilidad |

## 3. Stack tecnológico

- **Frontend:** React 18, Vite, TypeScript, Material UI, React Router, react-hook-form, zod, Recharts, axios, zxcvbn, vite-plugin-pwa.
- **Backend:** NestJS 10, TypeScript, TypeORM, PostgreSQL, passport-jwt, bcrypt, class-validator, pdfmake, ua-parser-js.
- **Infraestructura:** Docker, docker-compose, Kubernetes, GitHub.
- **Producción:** Vercel + Render + Neon.

## 4. Estructura del monorepo

```
medicitas/
├── backend/          # NestJS
│   └── src/
│       ├── auth/         # login, registro, JWT, captcha, guards
│       ├── users/        # CRUD usuarios (Admin)
│       ├── patients/     # CRUD pacientes
│       ├── doctors/      # CRUD doctores
│       ├── appointments/ # CRUD citas
│       ├── reports/      # PDF + estadísticas
│       ├── access-logs/  # auditoría de accesos
│       └── assistant/    # agente inteligente (fase 5)
├── frontend/         # React + Vite
│   └── src/
│       ├── api/          # cliente axios + servicios
│       ├── auth/         # contexto de sesión, login, registro
│       ├── components/   # layout, menú, tablas, formularios
│       └── pages/        # una carpeta por pantalla
├── k8s/              # Manifiestos Kubernetes
├── docker-compose.yml
└── README.md
```

## 5. Modelo de datos

- **users** — id, nombre, email (único), password_hash (bcrypt), rol (`ADMIN` | `RECEPCIONISTA`), is_active, deleted_at, timestamps.
- **patients** — id, nombres, apellidos, documento (CI, único), teléfono, email, fecha_nacimiento, género, deleted_at, timestamps.
- **doctors** — id, nombres, especialidad, teléfono, email, deleted_at, timestamps.
- **appointments** — id, patient_id (FK), doctor_id (FK), fecha, hora, motivo, estado (`PENDIENTE` | `ATENDIDA` | `CANCELADA`), notas, deleted_at, timestamps.
- **access_logs** — id, user_id (FK), ip, evento (`INGRESO` | `SALIDA`), browser, created_at. Sin borrado lógico: es auditoría inmutable.

Eliminación lógica: los listados excluyen registros con `deleted_at` (comportamiento
por defecto de TypeORM soft-delete). El Admin puede ver/restaurar eliminados en usuarios.

## 6. Seguridad

- **Login:** email + contraseña + token reCAPTCHA v2. El backend verifica el token contra
  la API de Google antes de validar credenciales. Respuesta: JWT (expiración 8 h) con id,
  email y rol en el payload.
- **Registro:** medidor de fuerza en vivo (zxcvbn → débil/intermedio/fuerte). El backend
  recalcula y rechaza contraseñas débiles. Hash con bcrypt (cost 10).
- **Permisos:** `JwtAuthGuard` global + `RolesGuard` con decorador `@Roles()`.
  - Admin: todo, incluidos usuarios y logs de acceso.
  - Recepcionista: pacientes y citas (CRUD), doctores (solo lectura).
- **Log de acceso:** el endpoint de login registra INGRESO (usuario, IP desde
  `x-forwarded-for`, navegador parseado con ua-parser-js); el endpoint de logout registra
  SALIDA. Pantalla de consulta con filtros para el Admin.

## 7. Pantallas (menú lateral)

1. Login / Registro (público, con CAPTCHA)
2. Dashboard — tarjetas resumen + gráficos (citas por mes, por doctor, por estado)
3. Pacientes — CRUD con búsqueda, validaciones y eliminación lógica
4. Doctores — CRUD
5. Citas — CRUD con selector de paciente/doctor, fecha/hora y estado
6. Reportes — generación de PDF por rango de fechas y por doctor
7. Usuarios (solo Admin) — CRUD de usuarios, restauración de eliminados
8. Logs de acceso (solo Admin) — tabla con filtros
9. Asistente — chatbot flotante (fase 5)

## 8. Manejo de errores

- Backend: `ValidationPipe` global (whitelist + transform), filtros de excepción con
  respuestas JSON uniformes `{ statusCode, message, error }`.
- Frontend: interceptor de axios — 401 redirige a login; errores de validación se
  muestran bajo cada campo; errores generales en snackbar.

## 9. Pruebas

- Backend: pruebas unitarias de los servicios críticos (auth: fuerza de contraseña,
  hash; appointments: reglas de estado) con Jest.
- Verificación manual guiada por fase (checklist en el plan de implementación).

## 10. Plan de entregas (5 fases)

1. **Fase 1 — Base y seguridad:** monorepo, NestJS + React funcionando, login JWT,
   reCAPTCHA, registro con fuerza de contraseña, logs de acceso.
2. **Fase 2 — CRUDs y menú:** pacientes, doctores, citas, usuarios; validaciones;
   eliminación lógica; layout con menú lateral.
3. **Fase 3 — Reportes y estadísticas:** PDF (pdfmake) + dashboard con Recharts.
4. **Fase 4 — DevOps:** Dockerfiles, docker-compose, manifiestos Kubernetes, subida a
   GitHub, despliegue Vercel/Render/Neon.
5. **Fase 5 — Opcionales:** PWA instalable + agente inteligente con API de Claude.
