# Cuaderno Digital Inteligente para Musicos (MVP Extendido)

Aplicacion web para musicos amateur/intermedio enfocada en organizacion de practica, composicion y contexto musical.

## Estado actual

El proyecto ahora incluye:

- Auth con JWT.
- Cuaderno digital con CRUD de entradas (`SONG`, `RIFF`, `IDEA`).
- Generador de progresiones y escalas.
- Metronomo integrado en frontend.
- Planes `FREE/PRO` con limites por plan.
- PostgreSQL como base de datos objetivo.
- Billing y suscripciones (`SIMULATED` + Stripe webhook).
- Backups automaticos por usuario.
- Versionado de entradas.
- Adjuntos por entrada (audio/tab/pdf/other) con almacenamiento local.
- Colaboracion en capa separada (`/api/collab`).
- Comunidad en capa separada (`/api/community`).

Nota: los nuevos modulos (billing/backups/versiones/adjuntos/collab/community) quedan listos a nivel API backend; la UI actual del frontend sigue enfocada en el flujo MVP original.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- ORM: Prisma
- DB: PostgreSQL
- Billing: Stripe (opcional) o modo simulado

## Estructura

```text
.
|- backend
|  |- prisma/schema.prisma
|  |- src
|  |  |- controllers
|  |  |- middleware
|  |  |- routes
|  |  |- services
|  |  |- app.js
|  |  |- server.js
|  |- docker-compose.yml
|  |- .env.example
|  |- package.json
|- frontend
|  |- src/...
|  |- package.json
|- README.md
```

## Como correr

### 1) Base de datos PostgreSQL

En `backend/`:

```bash
docker compose up -d
```

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Backend: `http://localhost:4000`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Variables de entorno importantes (backend)

- `DATABASE_URL`: conexion PostgreSQL.
- `BILLING_MODE`: `SIMULATED` o `STRIPE`.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`.
- `STORAGE_ROOT`: raiz de adjuntos/backups en disco.
- `MAX_ATTACHMENT_SIZE_MB`.
- `AUTO_BACKUP_INTERVAL_MINUTES`.

## Endpoints principales

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Cuaderno

- `GET /api/entries`
- `POST /api/entries`
- `PUT /api/entries/:entryId`
- `DELETE /api/entries/:entryId` (delete suave)
- `GET /api/entries/summary`

### Versionado

- `GET /api/entries/:entryId/versions`
- `POST /api/entries/:entryId/restore/:versionId`

### Adjuntos

- `GET /api/entries/:entryId/attachments`
- `POST /api/entries/:entryId/attachments` (base64 payload)
- `GET /api/attachments/:attachmentId/download`
- `DELETE /api/attachments/:attachmentId`

### Teoria musical

- `GET /api/theory/keys`
- `GET /api/theory/progressions?key=C&mode=MAJOR`
- `GET /api/theory/scales?key=A&mode=MINOR`

### Billing y suscripciones

- `GET /api/billing/status`
- `POST /api/billing/checkout`
- `POST /api/billing/cancel`
- `POST /api/billing/webhook` (Stripe)

### Backups

- `GET /api/backups`
- `POST /api/backups/run`
- `POST /api/backups/:backupId/restore`

### Colaboracion (capa separada)

- `GET /api/collab/shares/by-me`
- `GET /api/collab/shares/with-me`
- `POST /api/collab/shares`
- `DELETE /api/collab/shares/:shareId`
- `GET /api/collab/invites`
- `POST /api/collab/invites`
- `POST /api/collab/invites/:inviteId/respond`

### Comunidad (capa separada)

- `GET /api/community/feed` (publico)
- `GET /api/community/me/posts`
- `POST /api/community/me/posts`
- `PATCH /api/community/me/posts/:postId`

## Notas de diseno

- `FREE` y `PRO` comparten arquitectura; los limites se aplican desde `planService`.
- Billing en `SIMULATED` permite testear upgrade/cancel sin Stripe real.
- El versionado registra `CREATED/UPDATED/RESTORED/DELETED`.
- Los backups automaticos se disparan por actividad, respetando intervalo.
- Colaboracion y comunidad viven en rutas/controladores separados para evolucion independiente.
