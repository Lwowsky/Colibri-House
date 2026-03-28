# Colibri House — GitHub Admin (без БД, з власною адмінкою)

Цей пакет робить 2 речі:
- публічний сайт читає контент із `content/*.json`
- адмінка редагує цей контент і комітить зміни прямо в GitHub через **серверний API**

## Важливо

- **GitHub Pages може хостити тільки статичну частину**: сайт і `admin/`
- **логін, збереження і upload картинок працюють через Node.js API**
- тобто для продакшену потрібні **2 частини**:
  1. `GitHub Pages` → публічний сайт + `admin/`
  2. `Node server` → `/api/admin/*`

## Що безпечно

- логін і пароль **не лежать у фронтенді**
- GitHub token **не лежить у фронтенді**
- пароль зберігається як `scrypt` hash у `.env`
- адмінка отримує короткоживучий підписаний токен тільки після логіну
- усі записи в GitHub ідуть **тільки через сервер**

## Структура

- `content/site.json` — тексти сайту `uk/en/ja`
- `content/categories.json` — категорії меню
- `content/menu.json` — меню, ціни, фото, переклади
- `admin/index.html` — UI адмінки
- `admin/css/admin.css`
- `admin/js/admin.js`
- `server/index.js` — Node API + локальний сервер
- `tools/generate-admin-password-hash.mjs` — генератор хешу пароля

---

## 1. Локальний запуск

```bash
npm install
cp .env.example .env
```

Потім заповни `.env` і запусти:

```bash
npm run dev
```

Локально буде:
- `http://localhost:3000/`
- `http://localhost:3000/admin/`

---

## 2. Env змінні

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
ADMIN_ALLOWED_ORIGIN=http://localhost:3000,https://lwowsky.github.io
```

### `ADMIN_ALLOWED_ORIGIN`
Це список origin-ів, з яких дозволено відкривати адмінку.

Для GitHub Pages лиши щось типу:

```env
ADMIN_ALLOWED_ORIGIN=https://lwowsky.github.io
```

Якщо тестуєш локально і на GitHub Pages одночасно:

```env
ADMIN_ALLOWED_ORIGIN=http://localhost:3000,https://lwowsky.github.io
```

---

## 3. Як згенерувати пароль

Ти сам придумуєш пароль, наприклад:

```txt
ColibriAdmin2026!
```

Потім запускаєш:

```bash
node tools/generate-admin-password-hash.mjs "ColibriAdmin2026!"
```

Команда поверне рядок виду:

```txt
scrypt$...$...
```

Його вставляєш у `.env`:

```env
ADMIN_PASSWORD_HASH=scrypt$...$...
```

### Пароль міняється кожного разу?
Ні.

- ти входиш **тим самим звичайним паролем**, який придумав
- у `.env` лежить **не пароль**, а його хеш
- якщо ти заново перегенеруєш хеш для того самого пароля, рядок може бути іншим — це нормально
- але пароль для входу сам по собі **не змінюється**, поки ти його сам не змінюєш

---

## 4. Який GitHub token потрібен

Зроби **fine-grained personal access token** тільки для цього repo.

Потрібно:
- `Contents: Read and write`
- `Metadata: Read`

Цього достатньо для:
- читання `content/*.json`
- комітів у repo
- завантаження картинок у `content/uploads/...`

---

## 5. Як це працює на GitHub Pages

### Статична частина
Ти можеш залишити:
- сайт на `https://lwowsky.github.io/Colibri-House/`
- адмінку на `https://lwowsky.github.io/Colibri-House/admin/`

### Серверна частина
Node API треба задеплоїти окремо, наприклад на:
- Render
- Railway
- VPS
- будь-який Node hosting

Наприклад API буде жити тут:

```txt
https://colibri-admin-api.onrender.com
```

### Що робити в адмінці на GitHub Pages
Відкриваєш:

```txt
https://lwowsky.github.io/Colibri-House/admin/
```

і в полі **API base URL** вставляєш:

```txt
https://colibri-admin-api.onrender.com
```

Після цього:
- натискаєш **Зберегти API адресу**
- натискаєш **Перевірити API**
- логінишся
- редагуєш контент

Адреса API збережеться в цьому браузері.

---

## 6. Що редагується в адмінці

### Меню
- title `uk/en/ja`
- description `uk/en/ja`
- tag `uk/en/ja`
- ціна
- категорія
- sort
- active
- image path
- upload картинки
- додавання нових страв
- видалення страв

### Категорії
- id
- label `uk/en/ja`
- sort

### Тексти сайту
- будь-який текстовий ключ по сайту
- `hero_title`, `reserve_title`, `access_title` тощо
- для `uk/en/ja`

---

## 7. Upload картинок

При upload:
- файл іде на Node API
- API пушить його в GitHub repo
- шлях автоматично підставляється в поле картинки

За замовчуванням menu images заливаються в:

```txt
content/uploads/menu/
```

---

## 8. Для чого потрібні 2 частини

Тому що **GitHub Pages не вміє**:
- перевіряти логін/пароль на сервері
- приховувати GitHub token
- комітити зміни в repo без серверного шару

Саме тому:
- UI можна тримати на GitHub Pages
- безпечний API треба тримати окремо

---

## 9. Рекомендації

- використовуй тільки HTTPS
- постав довгий `ADMIN_SESSION_SECRET`
- токен GitHub дай тільки на один repo
- для продакшену краще мати окремий repo під сайт
- не коміть `.env`
- відкривай адмінку на GitHub Pages тільки як:

```txt
https://lwowsky.github.io/Colibri-House/admin/
```

зі слешем у кінці

---

## 10. Що вже виправлено в цьому архіві

- `admin/` коректно стилізується на GitHub Pages
- `/admin` автоматично редіректить на `/admin/`
- статичні файли адмінки підтягуються правильними шляхами
- адмінка вміє працювати з **окремим API base URL**
- Node API підтримує крос-доменний доступ для GitHub Pages
- авторизація може йти через підписаний bearer token, а не тільки same-origin cookie
