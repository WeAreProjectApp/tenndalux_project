# Technical Reference — Tenndalux

## Verificación de la ronda 2 (2026-10-02)

Los tests usan variables explícitas: `DJANGO_ENV=development`,
`DJANGO_DB_ENGINE=django.db.backends.sqlite3`, `DJANGO_DB_NAME=:memory:` y
`ENABLE_SILK=False`. El Python de pruebas existente se usa sin modificarlo;
no participa la base del servicio. SMTP/cola se controlan en sus fronteras.

El presupuesto de listados deriva de producción: vps-projectapp-prod,
4 vCPU/15 GB RAM, dos workers, un thread, CPUQuota 40%, MemoryMax 250M y
máximo seis consultas. La copia del estándar vive en
`docs/PERFORMANCE_STANDARDS.md`; detalles/bundle/cardinalidad quedan fuera
de la corrección de listas. Las fixtures 1→20 se crean fuera de la medición;
`page_size` no modifica la paginación actual.

> **Static export 2026-08-29:** `build_to_django.sh` delegates recursive `.txt`
> publication to `scripts/copy-static-export-payloads.sh`. Relative route paths
> are preserved under `backend/static/`; stale generated payload groups are
> removed before the new export is copied without deleting unrelated text assets.

## Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend framework | Django + DRF | Django 6.1, DRF 3.18.0 |
| Language | Python | 3.12+ |
| Frontend framework | Next.js + React | 16.1.6 + 19.2.3 |
| Frontend language | TypeScript | 5 |
| Database (prod) | MySQL | 8.4.11 |
| Database (dev) | SQLite | (default) |
| Cache / queue | Redis + Huey | Redis 8.1.0, Huey 3.3.4 |
| Auth | SimpleJWT | 5.5.1 |
| State management | Zustand | 5.0.11 |
| HTTP client | Axios | 1.13.4 |
| i18n | next-intl | 4.8.2 |
| CSS | Tailwind CSS | 4 |
| Animations | framer-motion + gsap + swiper | 12.34 + 3.14 + 12.1.1 |
| Icons | lucide-react + @heroicons/react | 0.574 + 2.2 |
| Backend testing | pytest + pytest-django | 9.1.1 + 4.14.0 |
| Frontend unit testing | Jest + Testing Library | 29.7 + latest |
| E2E testing | Playwright | 1.42 |

---

## Server Configuration

| Setting | Value |
|---------|-------|
| Server | `vps-projectapp-staging` (srv571894) |
| Server path | `/home/ryzepeck/webapps/tenndalux_project_staging` |
| Domain | `tenndalux.projectapp.co` |
| Gunicorn service | `tenndalux_project.service` |
| Huey service | `tenndalux-huey.service` |
| Socket | `/run/tenndalux_project.sock` |
| Nginx config | `/etc/nginx/sites-available/tenndalux_project` |
| Static files | `/home/ryzepeck/webapps/tenndalux_project_staging/backend/staticfiles/` |
| Media files | `/home/ryzepeck/webapps/tenndalux_project_staging/backend/media/` |
| Resource limits | MemoryMax=350M, CPUQuota=40%, OOMScoreAdjust=300 |

---

## Django Configuration

### Settings Files

| File | Purpose |
|------|---------|
| `backend/core_project/settings.py` | Base settings — loaded first in all environments |
| `backend/core_project/settings_dev.py` | Dev overrides (SQLite, DEBUG=True, console email) — auto-imported when `DJANGO_ENV=development` |
| `backend/core_project/settings_prod.py` | Prod overrides (MySQL, security headers, SMTP) — auto-imported when `DJANGO_ENV=production` |

Selection via `DJANGO_ENV` env var. Values loaded via `python-decouple` from `backend/.env` (not in git).

### Key Settings Values

```python
# Auth
AUTH_USER_MODEL = 'core_app.User'

# JWT
ACCESS_TOKEN_LIFETIME = timedelta(days=1)
REFRESH_TOKEN_LIFETIME = timedelta(days=7)
ROTATE_REFRESH_TOKENS = True
BLACKLIST_AFTER_ROTATION = True

# DRF
DEFAULT_AUTHENTICATION_CLASSES = (JWTAuthentication,)
DEFAULT_PERMISSION_CLASSES = (IsAuthenticated,)
PAGE_SIZE = 20

# Settings module for production
DJANGO_SETTINGS_MODULE = core_project.settings_prod

# Settings module for tests (pytest.ini)
DJANGO_SETTINGS_MODULE = core_project.settings
```

### INSTALLED_APPS (key entries)
```
rest_framework, rest_framework_simplejwt, rest_framework_simplejwt.token_blacklist,
corsheaders, easy_thumbnails, django_cleanup, django_attachments, core_app,
dbbackup, huey.contrib.djhuey
```

### Conditional Apps
- `django-silk`: enabled only when `ENABLE_SILK=True` env var is set. Provides profiling at `/silk/`.

---

## Backend File Layout

```
backend/
├── core_project/           Django project module
│   ├── settings.py         Base settings
│   ├── settings_dev.py     Dev overrides
│   ├── settings_prod.py    Prod overrides
│   ├── urls.py             Root URL config
│   ├── wsgi.py
│   ├── asgi.py
│   └── tasks.py            Huey periodic tasks
├── core_app/               Single business app
│   ├── models/             One file per domain
│   │   ├── base.py         TimestampedModel, SingletonModel
│   │   ├── user.py         User (email-based, roles)
│   │   ├── portfolio.py    Category, Style, Space, Project
│   │   ├── blog.py         Tag, Post
│   │   ├── services.py     Service, ProcessStep
│   │   ├── leads.py        LeadStatus, Lead
│   │   └── site.py         SiteSettings, HomePage, AboutPage
│   ├── serializers/        One file per domain
│   ├── views/              Mixed pattern — see architecture.md
│   ├── urls/               One file per domain
│   ├── tests/
│   │   ├── models/
│   │   ├── views/
│   │   └── serializers/
│   ├── management/commands/
│   ├── middleware/
│   ├── services/           Empty by design
│   └── utils/
├── django_attachments/     Vendored image library
├── templates/
│   └── frontend/           Next.js HTML output (deployed here)
├── static/                 _next/ assets + other static files
├── staticfiles/            Django collectstatic output
├── media/                  User uploads
├── conftest.py             Shared pytest fixtures
├── pytest.ini
├── requirements.txt
├── constraints.txt        Exact tested Python 3.12 resolution
└── manage.py
```

---

## Frontend File Layout

```
frontend/
├── app/                    Next.js App Router
│   ├── page.tsx            Home page
│   ├── layout.tsx          Root layout
│   ├── globals.css
│   ├── auth/               /auth/login, /auth/register
│   ├── blog/               /blog, /blog/[slug]
│   ├── portafolio/         /portafolio, /portafolio/[slug]
│   ├── servicios/          /servicios
│   ├── productos/          /productos
│   ├── dashboard/          /dashboard (protected)
│   └── __tests__/          Jest unit tests
├── lib/
│   ├── services/http.ts    Axios instance with JWT interceptors
│   ├── stores/authStore.ts Zustand auth store (persist middleware)
│   └── hooks/              useScrollAnimation, etc.
├── types/                  Shared TypeScript types
├── e2e/                    Playwright E2E tests
├── out/                    Next.js static export output (build artifact)
├── next.config.ts          output: 'export', trailingSlash: true
├── tailwind.config.ts      (if present)
├── jest.config.cjs
└── playwright.config.ts
```

---

## Backend Key Libraries

### `django_attachments` (vendored)
Located at `backend/django_attachments/`. Provides:
- `GalleryField` — multi-image attachment (FK to `Library` model). Used by `Project`, `HomePage`, `AboutPage`.
- `SingleImageField` — single image attachment (FK to `Attachment` model). Used by `Post`, `Service`, `HomePage` (testimonials), `SiteSettings` (logo, favicon).

**Note**: Gallery serializer integration is **partially complete** — models declare the fields but not all serializers expose the gallery URLs. Verify before assuming fields are exposed.

### Huey Periodic Tasks (`backend/core_project/tasks.py`)
| Task | Schedule |
|------|----------|
| `scheduled_backup` | Monday 02:00 UTC |
| `silk_garbage_collection` | Daily 04:00 UTC |
| `weekly_slow_queries_report` | Wednesday 07:00 UTC |
| `silk_reports_cleanup` | 1st of month 06:30 UTC |

---

## Frontend Key Libraries

### `lib/services/http.ts`
Instancia Axios central de negocio. Base URL: `http://localhost:8000/api` en dev,
`/api` en producción. Un segundo cliente interno renueva tokens sin interceptor.
- **Request interceptor**: lee `access_token` de cookies y agrega `Authorization: Bearer <token>`.
- **Response interceptor**: ante 401 comparte una renovación por pestaña usando
  `refresh_token`, guarda access y refresh rotados y reintenta cada petición una vez.
  Los 401 tardíos aprovechan el access ya actualizado. Ambas llamadas tienen timeout
  de 120 segundos; un fallo de renovación borra cookies y redirige a `/auth/login`.
- **Never bypass**: always import from `@/lib/services/http`. Never call `fetch()` or raw `axios` in components.

### `lib/stores/authStore.ts`
Zustand store with `persist` middleware.
- Los tokens viven en cookies; `persist` guarda sólo `user` bajo `auth-storage`.
- `initializeAuth()` recupera el perfil cuando existe access y falta el usuario.

---

## Key Environment Variables

### Backend (`backend/.env`)
| Variable | Purpose |
|----------|---------|
| `DJANGO_ENV` | `development` or `production` |
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | `True` / `False` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `DJANGO_DB_ENGINE` | Database engine (SQLite default in dev) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | MySQL credentials (prod) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `JWT_ACCESS_TOKEN_LIFETIME_DAYS` | Default: 1 |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Default: 7 |
| `ENABLE_SILK` | `True` to enable Silk profiling |

### Frontend (`frontend/.env.local`)
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL |

---

## Testing Setup

### Python Dependency Resolution
- `backend/requirements.txt` declares direct dependencies and their supported
  ranges; it loads `backend/constraints.txt` with `-c constraints.txt`.
- `backend/constraints.txt` pins the complete tested Python 3.12 resolution.
- Django is pinned to 6.1 and the fleet host runs MySQL 8.4.11, satisfying
  [Django 6.1's MySQL 8.4+ requirement](https://docs.djangoproject.com/en/6.1/ref/databases/#mysql-notes).
- Upgrade one dependency per commit and require a green PR CI run before the
  next bump, especially across major versions.

### Backend
- `pytest.ini` sets `DJANGO_SETTINGS_MODULE = core_project.settings` (dev/SQLite for tests)
- `backend/conftest.py` has shared fixtures and a custom coverage reporter
- Test command: `cd backend && source venv/bin/activate && pytest core_app/tests/path/to/test_file.py -v`
- Never run the full suite; max 20 tests per batch, 3 commands per cycle

### Frontend Unit (Jest)
- Config: `jest.config.cjs` with jsdom environment
- `jest.setup.ts` for global test setup
- Mocks: `framer-motion`, `swiper`, CSS modules
- Test command: `cd frontend && npm test -- path/to/file.test.tsx`

### Frontend E2E (Playwright)
- Config: `playwright.config.ts` — `testDir: './e2e'`, Desktop Chrome only
- Base URL: `http://localhost:3000` (or `PLAYWRIGHT_BASE_URL` env var)
- Test command: `cd frontend && npx playwright test e2e/path/to/spec.ts`
- Use `E2E_REUSE_SERVER=1` when a dev server is already running

---

## CI/CD

- `.github/workflows/ci.yml` — backend, frontend unit, E2E, and coverage jobs;
  the Python cache key includes both requirements and constraints
- `.github/workflows/test-quality-gate.yml` — test quality gate runs on push
- No automated deployment pipeline — deployments are operator-run (via the `/deploy-and-check` flow)
- Pre-commit hooks: `.pre-commit-config.yaml`
