# Task Manager API

Backend REST para gestion de tareas construido con Spring Boot, Maven, PostgreSQL y JWT.
Incluye un frontend en HTML, CSS y JavaScript servido por Spring Boot.

## Requisitos

- Java 17
- Maven 3.9+
- PostgreSQL

## Variables configurables

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `APP_CORS_ALLOWED_ORIGINS`
- `JWT_SECRET_KEY`
- `JWT_EXPIRATION`
- `SERVER_PORT`
- `DDL_AUTO`
- `SHOW_SQL`

## Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Tasks

- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

## Base configurada por defecto

- Host: `localhost`
- Port: `5432`
- Database: `codex_test`
- Username: `postgres`
- Password: `a`

## Frontend de prueba

Una vez levantada la app, abri:

- `http://localhost:8080`

Desde ahi podes:

- registrarte
- iniciar sesion
- crear tareas
- editar tareas
- eliminar tareas
- ver el token funcionando contra la API real

## Deploy sugerido

### Neon

Tu cadena de Neon llego en formato URI de PostgreSQL. Para Spring Boot en Render conviene cargarla separada asi:

- `DB_URL=jdbc:postgresql://ep-purple-truth-amv5sbl7-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- `DB_USERNAME=neondb_owner`
- `DB_PASSWORD=<tu password de Neon>`

### Render

Variables recomendadas en Render:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET_KEY`
- `JWT_EXPIRATION=86400000`
- `DDL_AUTO=update`
- `SHOW_SQL=false`
- `APP_CORS_ALLOWED_ORIGINS=https://tu-frontend.netlify.app`

Comando de arranque:

```text
mvn spring-boot:run
```

### Netlify

El frontend ya puede apuntar a una API externa usando [config.js](C:/Users/Marco/OneDrive/Desktop/Codex_test/src/main/resources/static/config.js).

Para Netlify, cambia:

```js
window.APP_CONFIG = {
    API_BASE: "https://tu-backend-en-render.onrender.com/api"
};
```

Si queres separar solo el frontend, subi los archivos de `src/main/resources/static`.

## Ejemplos

### Registro

```json
POST /api/auth/register
{
  "name": "Marco",
  "email": "marco@example.com",
  "password": "secret123"
}
```

### Login

```json
POST /api/auth/login
{
  "email": "marco@example.com",
  "password": "secret123"
}
```

### Crear tarea

```json
POST /api/tasks
Authorization: Bearer <token>
{
  "title": "Preparar entrega",
  "description": "Terminar backend del task manager",
  "status": "PENDING",
  "dueDate": "2026-03-30"
}
```
