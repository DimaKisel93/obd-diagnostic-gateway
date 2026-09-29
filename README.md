# OBD-II Diagnostic Gateway

NestJS-сервис, который подключается к автомобилю через **ELM327**, собирает телеметрию в реальном времени, сохраняет в PostgreSQL и отдаёт через REST API и WebSocket. Плюс простой Vue-дашборд для «живых» RPM / скорости.

Портфолио-проект: железо через Node, модульная архитектура NestJS, потоки данных, API и realtime UI.

## Стек

| Слой     | Технологии                                                              |
| -------- | ----------------------------------------------------------------------- |
| Backend  | NestJS, TypeScript                                                      |
| Железо   | ELM327 (USB/Bluetooth), библиотека `elm327` (J2534 — опционально позже) |
| База     | PostgreSQL                                                              |
| Realtime | WebSocket (`@nestjs/websockets`)                                        |
| Frontend | Vue 3 + WebSocket                                                       |

Без адаптера работает **mock-режим** — удобно для разработки и демо.

## Структура репозитория

```
ObdDiagnosticGateway/
├── backend/          # NestJS API + OBD-модуль
├── frontend/         # Vue live-дашборд (шаг 7)
├── docker-compose.yml
└── README.md
```

## Быстрый старт (после шага 1)

```bash
cd backend
npm install
npm run start:dev
```

Проверка:

```bash
curl http://localhost:3000/api/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "service": "obd-diagnostic-gateway",
  "version": "0.1.0"
}
```

## Архитектура (целевая)

```
[ELM327 / Mock] → ObdAdapter → TelemetryService → PostgreSQL
                                      ↓
                              REST + WebSocket → Vue Dashboard
```

## Лицензия

MIT
