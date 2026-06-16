# SolarBoss + Яндекс.Метрика: визиты за месяц + 1346

## 1) Счётчик Метрики
ID счётчика: `109886442`

Код Метрики уже вставлен в:
- `solarboss/index.html`
- `solarboss-landing/index.html`

## 2) Автообновление `stats.json` (GitHub Pages)
Так как `solarboss.ru` обслуживается GitHub Pages (статический хостинг), обновлять `stats.json` нужно через GitHub Actions.

В репозитории добавлены:
- `.github/workflows/metrika-stats.yml`
- `scripts/update_metrika_stats.mjs`

### Нужно сделать в GitHub
1. Открой репозиторий сайта → **Settings → Secrets and variables → Actions**
2. Добавь secret:
   - `METRIKA_OAUTH_TOKEN` = OAuth‑токен Яндекса с правом `metrika:read`

### Как получить OAuth‑токен
1. Создай приложение в OAuth Яндекса
2. Получи токен по ссылке:
   - `https://oauth.yandex.com/authorize?response_type=token&client_id=<CLIENT_ID>`
3. Скопируй токен и положи в secret `METRIKA_OAUTH_TOKEN`

## 3) Где берётся число на лендинге
Лендинг читает `stats.json`, берёт `monthlyVisits` и показывает:
`monthlyVisits + 1346`.

