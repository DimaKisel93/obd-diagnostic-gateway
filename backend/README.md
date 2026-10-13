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

## REST API

Базовый URL: `http://localhost:3000/api`

### Health / adapter

| Method | Path                  | Описание               |
| ------ | --------------------- | ---------------------- |
| GET    | `/health`             | Сервис + PostgreSQL    |
| GET    | `/adapter`            | Адаптер + поллер       |
| POST   | `/adapter/connect`    | Подключить ELM327/mock |
| POST   | `/adapter/disconnect` | Отключить              |

### Live / history

| Method | Path                     | Описание                     |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/live`                  | Сэмпл с адаптера (не из БД)  |
| GET    | `/live/snapshot`         | Последние значения PID из БД |
| GET    | `/live/history?limit=20` | Последние строки из БД       |

### Sessions

| Method | Path                                                          | Описание                                            |
| ------ | ------------------------------------------------------------- | --------------------------------------------------- |
| GET    | `/sessions?status=active\|closed\|all&skip=0&take=20`         | Список сессий                                       |
| GET    | `/sessions/active`                                            | Открытая сессия или `null`                          |
| GET    | `/sessions/:id`                                               | Сессия + `readingsCount`                            |
| GET    | `/sessions/:id/history?name=rpm&pid=0C&from=&to=&skip=&take=` | История PID                                         |
| POST   | `/sessions/:id/end`                                           | Закрыть сессию (остановит поллер, если это текущая) |

### Poller

| Method | Path            | Описание                        |
| ------ | --------------- | ------------------------------- |
| GET    | `/poller`       | `running`, `sessionId`, `ticks` |
| POST   | `/poller/start` | Старт опроса + сессия           |
| POST   | `/poller/stop`  | Стоп опроса                     |

```bash
curl http://localhost:3000/api/adapter
curl http://localhost:3000/api/live
curl "http://localhost:3000/api/sessions?status=active"
curl "http://localhost:3000/api/sessions/<id>/history?name=rpm&take=10"
```
