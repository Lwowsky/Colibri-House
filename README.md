# Colibri House — GitHub Admin (без бази даних, без Supabase)

Цей пакет переводить сайт на JSON-контент і додає **власну адмінку** з безпечним логіном/паролем.

Що важливо:
- **замовнику не потрібен GitHub-акаунт**
- **логін, пароль і GitHub token не лежать у фронтенді**
- адмінка працює через **серверний API**
- зміни комітяться **прямо в GitHub repo**
- сайт читає публічний контент із `content/*.json`

## Структура

- `content/site.json` — всі тексти сайту (`uk`, `en`, `ja`)
- `content/categories.json` — категорії меню
- `content/menu.json` — позиції меню, ціни, картинки, переклади
- `admin/index.html` — адмінка
- `admin/css/admin.css`
- `admin/js/admin.js`
- `server/index.js` — власний бекенд API + статичний сервер
- `tools/generate-admin-password-hash.mjs` — генератор безпечного хешу пароля

## Як працює безпека

1. Клієнт відкриває `/admin`
2. Логін і пароль відправляються на **сервер**
3. Сервер перевіряє пароль по `scrypt`-хешу з env-змінної
4. Якщо все ок — сервер ставить `HttpOnly` cookie
5. Браузер **не бачить** пароль, хеш або GitHub token
6. Коли натискаєш `Зберегти`, сервер комітить нові JSON у GitHub через token з env

Секрети не потрапляють у `admin.js` або публічний сайт.

## Потрібні env змінні

Створи `.env` на основі `.env.example`:

```env
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt$YOUR_SALT$YOUR_HASH
ADMIN_SESSION_SECRET=long_random_secret_at_least_32_chars
GITHUB_TOKEN=github_pat_xxx
GITHUB_REPO_OWNER=your-github-username-or-org
GITHUB_REPO_NAME=your-repo-name
GITHUB_REPO_BRANCH=main
CONTENT_DIR=content
```

## Як згенерувати хеш пароля

```bash
node tools/generate-admin-password-hash.mjs "YourStrongPassword"
```

Скопіюй результат у `ADMIN_PASSWORD_HASH`.

## Який GitHub token потрібен

Зроби **fine-grained personal access token** з доступом тільки до потрібного репозиторію.

Мінімально потрібно:
- `Contents: Read and write`
- `Metadata: Read`

## Локальний запуск

```bash
npm install
cp .env.example .env
npm run dev
```

Сайт буде доступний на:
- `http://localhost:3000/`
- `http://localhost:3000/admin/`

## Що саме редагується в адмінці

### Меню
- назва (`uk/en/ja`)
- опис (`uk/en/ja`)
- tag (`uk/en/ja`)
- ціна
- категорія
- порядок
- активність
- картинка
- додавання нової страви
- видалення страви

### Категорії
- `id`
- label у 3 мовах
- порядок

### Тексти сайту
- будь-які ключі, які сайт читає через `data-i18n`
- наприклад `hero_title`, `reserve_title`, `access_title`

## Завантаження картинок

Коли в адмінці вибираєш файл:
- він відправляється на сервер
- сервер завантажує його в GitHub у `content/uploads/menu/`
- у поле картинки автоматично підставляється шлях

## Як відбувається збереження

При натисканні `Зберегти в GitHub` сервер:
- бере нові `site.json`, `categories.json`, `menu.json`
- створює commit у GitHub
- твоя платформа хостингу підтягує зміни як звичайний deploy із repo

## Деплой

Цей пакет найкраще запускати там, де є **Node.js сервер**:
- VPS
- Railway
- Render
- Fly.io
- будь-який хостинг з Node

### Важливо
Якщо твій сайт зараз лежить на **чистому static hosting без Node**, сама адмінка UI відкриється, але API для логіну/збереження не працюватиме. Для безпечного логіну і комітів у GitHub потрібен серверний runtime.

## Що вже змінено в публічному сайті

- сайт більше не залежить від ручного редагування `js/i18n.uk.js`, `js/i18n.en.js`, `js/i18n.ja.js`
- контент тепер береться з `content/*.json`
- логіка перемикання мов збережена
- меню, категорії та тексти працюють з JSON

## Примітка про старі файли

У вихідному архіві були старі файли `supabase/`, але в цьому пакеті вони **не використовуються**.

## Рекомендації по продакшену

- використовуй тільки HTTPS
- зроби довгий `ADMIN_SESSION_SECRET`
- не давай GitHub token доступ ширше, ніж потрібно
- краще мати окремий repo тільки під цей сайт
- регулярно роби backup `.env`
