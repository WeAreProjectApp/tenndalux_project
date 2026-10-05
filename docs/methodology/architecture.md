# Architecture — Tenndalux

> **RSC payload path:** Next's export produces route-scoped files such as
> `servicios/__next._tree.txt` and `portafolio/index.txt`. The deployment split
> now copies them recursively to `backend/static/<route>/`, where nginx serves
> them directly; HTML continues through Django.

## System Overview

Tenndalux is a **Django + Next.js static export** stack. There is no Node.js server in production. The frontend builds to static HTML/JS/CSS files that Django serves directly.

```
Browser
  │
  ├── Static assets (_next/, favicon, etc.)
  │     └── Nginx → backend/static/
  │
  └── Page requests (/, /portafolio/, etc.)
        └── Nginx → Gunicorn → Django → frontend_views.py
              reads HTML from backend/templates/frontend/
              returns raw HttpResponse (no template engine)
  │
  └── API calls (/api/*)
        └── Nginx → Gunicorn → Django → DRF views
              returns JSON
```

---

## Directory Structure

```
tenndalux_project/              repo root
├── backend/                    Django + DRF
│   ├── core_project/           Django project module (NOT tenndalux_project)
│   │   ├── settings.py         base settings (loaded first)
│   │   ├── settings_dev.py     dev overrides (DJANGO_ENV=development)
│   │   ├── settings_prod.py    prod overrides (DJANGO_ENV=production)
│   │   ├── urls.py             root URL config
│   │   └── tasks.py            Huey periodic tasks
│   ├── core_app/               single business app
│   │   ├── models/             domain model files
│   │   ├── views/              mixed DRF view pattern (see below)
│   │   ├── serializers/        DRF serializers per domain
│   │   ├── urls/               URL routing per domain
│   │   ├── tests/              pytest (models/, views/, serializers/)
│   │   ├── management/commands/ create_fake_data, delete_fake_data
│   │   └── services/           empty by design
│   ├── django_attachments/     vendored image library
│   ├── templates/frontend/     Next.js HTML output (served by frontend_views.py)
│   ├── static/                 _next/ assets + other static
│   ├── staticfiles/            Django collectstatic output
│   ├── requirements.txt        Direct Python dependencies and ranges
│   └── constraints.txt         Exact tested Python 3.12 resolution
├── frontend/                   Next.js 16 + React 19
│   ├── app/                    App Router pages
│   ├── lib/services/http.ts    Axios wrapper (JWT interceptors)
│   ├── lib/stores/authStore.ts Zustand auth store
│   ├── lib/hooks/              useScrollAnimation, etc.
│   ├── e2e/                    Playwright E2E specs
│   └── out/                    build output (HTML + _next/) — NOT committed
├── docs/methodology/           Memory Bank
├── tasks/                      Active context + task plan
├── scripts/                    Quality gate, systemd units, nginx config
├── .agents/skills/             Codex skills
├── .claude/skills/             Claude Code skills
└── .codex/config.toml          Codex project config
```

---

## Data Model

### Base Classes (`core_app/models/base.py`)

```python
TimestampedModel(models.Model):
    created_at = DateTimeField(auto_now_add=True, db_index=True)
    updated_at = DateTimeField(auto_now=True, db_index=True)
    # abstract = True

SingletonModel(models.Model):
    # Enforces pk=1 on save. Use cls.load() to retrieve.
    # abstract = True
```

### Domain Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User` | email (unique), first_name, last_name, role, phone, avatar | Extends `AbstractUser`; no username field; roles: admin/editor/viewer |
| `Category` | name, slug, order | Portfolio taxonomy |
| `Style` | name, slug, order | Portfolio taxonomy |
| `Space` | name, slug, order | Portfolio taxonomy |
| `Project` | title, slug, description, location, year, area_sqm, featured, is_published, gallery (GalleryField), categories (M2M), styles (M2M), spaces (M2M) | Gallery partial |
| `Tag` | name, slug, order | Blog taxonomy |
| `Post` | title, slug, excerpt, content, cover_image (SingleImageField), author (FK User), tags (M2M), is_published, published_at, meta fields | |
| `Service` | title, slug, short_description, full_description, includes (JSON), excludes (JSON), icon (SingleImageField), image (SingleImageField), order, is_active | |
| `ProcessStep` | title, description, duration, deliverables (JSON), order, is_active | |
| `LeadStatus` | name, color, order | CRM pipeline stages |
| `Lead` | full_name, email, phone, city, project_type (FK Category), space_types (M2M Space), message, budget_range, how_found_us, source, UTM fields, status (FK LeadStatus), notes | |
| `SiteSettings` | company_name, tagline, phone, whatsapp_number, email, address, city, social URLs, logo, favicon, footer_text | SingletonModel |
| `HomePage` | hero fields, hero_media (GalleryField), value_proposition_items (JSON), featured_projects (M2M), testimonials (GalleryField), meta fields | SingletonModel |
| `AboutPage` | title, content, team_section (JSON), gallery (GalleryField), meta fields | SingletonModel |

---

## View Pattern

The project uses **different DRF view styles per resource type**. Always match the pattern of the domain you're extending:

| File | Pattern | Resources |
|------|---------|-----------|
| `auth_views.py` | FBV with `@api_view` | register, login, token refresh, profile GET/PATCH |
| `portfolio_views.py` | `ModelViewSet` + `DefaultRouter` | CategoryViewSet, StyleViewSet, SpaceViewSet, ProjectViewSet |
| `blog_views.py` | `ModelViewSet` + `DefaultRouter` | TagViewSet, PostViewSet |
| `services_views.py` | `ModelViewSet` + `DefaultRouter` | ServiceViewSet, ProcessStepViewSet |
| `leads_views.py` | `ModelViewSet` + `DefaultRouter` | LeadStatusViewSet, LeadViewSet |
| `site_views.py` | `generics.RetrieveUpdateAPIView` | SiteSettingsView, HomePageView, AboutPageView |
| `frontend_views.py` | Plain Django FBV | Serves HTML from `backend/templates/frontend/` |

### Permission Pattern
- **Portfolio, Blog, Services**: `IsContentEditorOrReadOnly` — public GET, editor/admin write.
- **Leads create**: `AllowAny` + `LeadCaptureSerializer` — public POST without internal CRM fields; `IsRoleAdmin` for every other action.
- **Lead statuses and singleton pages**: `IsRoleAdminOrReadOnly` — public reads, admin-only writes. Superusers retain administrator access; `is_staff` alone grants no API role.
- **Auth endpoints**: `AllowAny` for register/login; `IsAuthenticated` for profile

---

## URL Structure

```
/admin/                         Django Admin (session + CSRF)
/api/health/                    Health check (public)
/api/auth/register/             POST — user registration
/api/auth/login/                POST — JWT login
/api/auth/token/refresh/        POST — refresh access token
/api/auth/profile/              GET — own profile
/api/auth/profile/update/       PATCH — update profile
/api/portfolio/categories/      CRUD via DefaultRouter
/api/portfolio/styles/          CRUD via DefaultRouter
/api/portfolio/spaces/          CRUD via DefaultRouter
/api/portfolio/projects/        CRUD via DefaultRouter
/api/blog/tags/                 CRUD via DefaultRouter
/api/blog/posts/                CRUD via DefaultRouter
/api/services/services/         CRUD via DefaultRouter
/api/services/process-steps/    CRUD via DefaultRouter
/api/leads/statuses/            CRUD via DefaultRouter
/api/leads/leads/               POST public; other methods admin-only
/api/site/settings/             GET public; PATCH/PUT auth-required
/api/site/home/                 GET public; PATCH/PUT auth-required
/api/site/about/                GET public; PATCH/PUT auth-required
/_next/..., /home/..., etc.     Static assets (Django in dev; Nginx in prod)
/*                              Frontend pages (catch-all, serves HTML from templates/frontend/)
```

---

## Frontend Architecture

### Static Export Flow
```
npm run build
  → next.config.ts: output: 'export'
  → frontend/out/
      ├── index.html          → backend/templates/frontend/index.html
      ├── portafolio/index.html → backend/templates/frontend/portafolio/index.html
      ├── blog/{slug}/index.html → ...
      └── _next/              → backend/static/_next/

Django serves:
  frontend_views.py reads HTML from backend/templates/frontend/ → HttpResponse
  URL patterns in debug mode: _next/ served from backend/static/_next/
  Nginx in prod: _next/ served directly from backend/static/_next/
```

**Note**: The `build_to_django.sh` script in `frontend/` automates the export and copy (`npm ci && bash build_to_django.sh`).

### Auth Flow
```
Client Component renders
  → useEffect → useAuthStore.hydrate()
        reads cookies via js-cookie
        populates store state
  → http.ts interceptor
        reads accessToken cookie → Authorization header
        on 401 → refresh → retry → or redirect to /auth/login
```

### Routing
- Flat App Router (no `(public)/(app)` grouped routes)
- Auth enforced per-page using `useAuthStore.isAuthenticated` after `hydrate()`
- All routes are statically generated at build time — no SSR

---

## Serialización y validación de la ronda 2 (2026-10-02)

La validación de bloques es común a modelos, serializers y revisión del admin.
Los objetos anidados declaran textos obligatorios, campos opcionales y claves
permitidas; el esquema y la guía se generan desde esas mismas reglas.

La persistencia del contacto es el resultado principal del POST. El despacho
a Huey es secundario: su fallo conserva el contacto y produce una señal local
saneada. Esta política no promete entrega posterior de la notificación.

Los listados precargan las relaciones que serializan. Proyectos y posts usan
un ListSerializer común que resuelve las imágenes de bloques por página, con
un mapa limitado a la representación actual y fallback para objetos sueltos.
No hay caché global ni cambios de permisos, paginación o respuesta.

## Key Architectural Invariants

1. **Single business app**: All models, views, serializers, and tests in `core_app`. No second app.
2. **Django module naming**: Module is `core_project`, app is `core_app` — do not rename to `tenndalux_*`.
3. **No runtime SSR**: Static export only. Server Components get build-time data; dynamic data is client-side.
4. **No service layer**: `core_app/services/` is empty. Logic in views and serializers.
5. **No raw HTTP in frontend**: All requests via `lib/services/http.ts`.
6. **No shadcn/MUI**: Custom components only.
7. **Singletons via `.load()`**: Never `.objects.create()` for `SiteSettings`, `HomePage`, `AboutPage`.
8. **Slugs auto-generated**: All slug-bearing models override `save()` to call `generate_unique_slug()`.
9. **JWT for API, session for admin**: These two auth surfaces are separate and must not be mixed.
10. **Gallery integration partial**: `GalleryField` on models is declared; serializers may not expose all gallery URLs yet. Verify before assuming.
11. **Python resolution is two-layered**: Keep direct ranges in `requirements.txt` and the full tested resolution in `constraints.txt`. Django 6.1 requires MySQL 8.4+; production satisfies this with MySQL 8.4.11.
