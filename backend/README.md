# OBD Diagnostic Gateway — Backend

NestJS-сервис шлюза диагностики OBD-II. ORM: **Prisma 7**, БД: **PostgreSQL**, OBD: **mock ELM327**.

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

| Script                       | Описание                        |
| ---------------------------- | ------------------------------- |
| `pnpm start:dev`             | Dev-сервер с watch              |
| `pnpm prisma:generate`       | Генерация Prisma Client         |
| `pnpm prisma:migrate`        | Миграции (`prisma migrate dev`) |
| `pnpm prisma:migrate:deploy` | Применить миграции              |
| `pnpm prisma:studio`         | GUI для БД                      |
| `pnpm test`                  | Unit-тесты                      |

## API

| Method | Path                  | Описание                   |
| ------ | --------------------- | -------------------------- |
| GET    | `/api/health`         | Health + статус БД         |
| GET    | `/api/obd/status`     | Адаптер / connected        |
| POST   | `/api/obd/connect`    | Подключить адаптер         |
| POST   | `/api/obd/disconnect` | Отключить                  |
| GET    | `/api/obd/sample`     | Живой сэмпл RPM/скорость/… |

```bash
curl http://localhost:3000/api/obd/status
curl http://localhost:3000/api/obd/sample
```
