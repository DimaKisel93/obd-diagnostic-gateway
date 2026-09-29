# OBD Diagnostic Gateway — Backend

NestJS-сервис шлюза диагностики OBD-II. ORM: **Prisma 7**, БД: **PostgreSQL**.

## Setup

```bash
# из корня репозитория
docker compose up -d

cd backend
cp .env.example .env
pnpm install
pnpm prisma:migrate:deploy
pnpm start:dev
```

## Scripts

| Script | Описание |
|--------|----------|
| `pnpm start:dev` | Dev-сервер с watch |
| `pnpm prisma:generate` | Генерация Prisma Client |
| `pnpm prisma:migrate` | Миграции (`prisma migrate dev`) |
| `pnpm prisma:migrate:deploy` | Применить миграции |
| `pnpm prisma:studio` | GUI для БД |

Health: `GET http://localhost:3000/api/health`
