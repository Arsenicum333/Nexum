# Nexum [In Progress]

Chat platform that you never asked, but always wanted.

## Prerequisites

- Node.js 24+
- Docker Desktop

## Project Setup

Install the frontend and backend dependencies:
```bash
cd frontend
npm install

cd ../backend
npm install
```

Create the backend environment file:
```bash
cd backend
cp .env.example .env
node ace generate:key
```
On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Database

Start PostgreSQL from the project root:
```bash
docker compose up -d postgres
```

The default connection uses database `nexum`, user `user`, and password `password`.
These values can be overridden with `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, and `DB_PORT` in `backend/.env`.

Run the database migrations:
```bash
cd backend
node ace migration:run
```

Check the database container:
```bash
docker compose ps
```

Stop PostgreSQL when it is no longer needed:
```bash
docker compose down
```

## Development

Run the frontend and backend in separate terminals.

**Frontend (Quasar):**
```bash
cd frontend
npm run dev
```

**Backend (AdonisJS):**
```bash
cd backend
npm run dev
```

## Build

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm run build
```
