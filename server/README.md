# SKS Stats API

Минимальный API для сохранения/загрузки статистики игрока. Хранит весь объект
`storage` (см. `BASE_STORAGE` в `src/js/storage/StorageManager.js`) одной JSON-строкой
в SQLite, без валидации содержимого.

## Эндпоинты

- `GET /api/stats/:userId` — вернуть сохранённый storage-объект игрока (404, если ещё нет записи)
- `POST /api/stats/:userId` — сохранить/перезаписать storage-объект игрока (тело запроса — JSON)

`userId` — id пользователя Telegram (`Telegram.WebApp.initDataUnsafe.user.id`), берётся
клиентом как есть, без проверки подписи initData.

## Локальный запуск

```
cd server
npm install
npm start
```

Сервер поднимется на `http://localhost:3001`, файл БД — `server/data/stats.db`.

## Деплой (Railway/Render)

1. Создать новый сервис из репозитория, root directory — `server`.
2. Build command не нужен (нет шага сборки), start command — `npm install && npm start`
   (или отдельно install/start, в зависимости от платформы).
3. Указать volume/persistent disk под `server/data`, иначе SQLite-файл будет
   пересоздаваться при каждом деплое/рестарте контейнера.
4. Прописать `VITE_API_URL` в `.env` фронтенда на URL задеплоенного сервиса
   (см. `.env.example` в корне проекта).
