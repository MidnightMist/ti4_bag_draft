# ti4_bag_draft

## Локальный запуск (Local Development)

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск проекта для разработки
Для одновременного запуска бэкенда (порт 4000) и фронтенда Vite (порт 3000):
```bash
npm run dev:local
```
или:
```bash
npm run dev
```

> **Примечание по ошибке с Yarn:**  
> Если в вашей IDE (VS Code) настроен запуск через `yarn`, а сам Yarn не установлен в системе, запускайте команду через `npm`:
> `npm run dev:local` вместо `yarn run dev`. Либо установите yarn глобально: `npm install -g yarn`.
