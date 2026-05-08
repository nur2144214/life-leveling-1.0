# Инструкция по Django бэкенду для QuestRPG

Теперь проект полностью отвязан от Firebase. Вам нужно реализовать следующие API эндпоинты в вашем Django проекте (используйте Django REST Framework).

### 1. Настройка Django
Установите `django`, `djangorestframework`, `django-cors-headers`, `google-generativeai` и `pyjwt`.

### 2. Список Эндпоинтов (Endpoints)

#### АУТЕНТИФИКАЦИЯ
*   **POST** `/api/login/google` — Принимает токен от Google (если используете Google Auth) или просто возвращает ваш внутренний JWT токен.
    *   *Ответ:* `{ "token": "ваш_jwt_токен", "user": { ... } }`

#### ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
*   **GET** `/api/profile` — Возвращает данные текущего пользователя (на основе JWT).
*   **PATCH** `/api/profile` — Обновление целей или характеристик пользователя.
    *   *Пример тела:* `{ "goals": "Новые цели", "xp": 150, "level": 2 }`

#### КВЕСТЫ
*   **GET** `/api/quests` — Список квестов пользователя на сегодня.
*   **POST** `/api/generate-quests` — Вызов Gemini для создания квестов и сохранение их в базу Django.
*   **PATCH** `/api/quests/<id>` — Изменение статуса квеста (например, на `completed`).

### 3. Модели в Django (примерные)

**UserProfile:**
- `user` (OneToOne с User)
- `level` (Integer)
- `xp` (Integer)
- `goals` (Text)
- `strength`, `intelligence`, `creativity`, `stamina` (Integer)

**Quest:**
- `user` (ForeignKey на User)
- `title`, `description` (String)
- `difficulty` (Choice: easy, medium, hard)
- `attribute` (Choice: strength, etc)
- `xp_reward` (Integer)
- `status` (Choice: pending, completed)
- `date` (Date)

### 4. CORS
Не забудьте добавить `localhost:3000` в `CORS_ALLOWED_ORIGINS` в `settings.py`.
