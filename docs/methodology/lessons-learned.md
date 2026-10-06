# Lessons Learned — Tenndalux

> **Lección 2026-10-06:** que una imagen figure en Django Admin no prueba que
> el frontend la use: una `Library` se serializa como id hasta exponer su
> adjunto principal. En un export estático, consultar su URL desde el cliente
> permite editar la portada sin otro build. Para el favicon, comprobar el
> archivo efectivamente copiado y la URL pública, además del enlace del HTML.
> Cuenta staff/permisos de Django y rol JWT son superficies distintas.

This file captures non-obvious patterns, preferences, and project intelligence discovered during development. Updated as insights are found.

> **Lección 2026-08-29:** un static export de App Router no es sólo HTML más
> `_next/`. Los `.txt` por ruta son parte del protocolo de navegación; cualquier
> copier hacia Django debe preservar recursivamente el árbol completo y probar
> una ruta anidada, no sólo la portada.

---

## Architecture Decisions

### View Pattern: Mixed, Not Uniform
The codebase uses **different DRF view styles per domain**, not a single pattern across all views:
- Auth: FBV with `@api_view` (non-CRUD workflow)
- Content (portfolio, blog, services, leads): `ModelViewSet` + `DefaultRouter` (standard CRUD)
- Singletons (site settings, pages): `generics.RetrieveUpdateAPIView`
- Frontend HTML serving: plain Django FBV (no DRF)

**Lesson**: When adding a new endpoint, extend the pattern in that view file. Do not assume all views are FBV.

### Static Export Deployment: Two Destinations
`next build` emits `frontend/out/` which must be split on deployment:
- HTML pages (`index.html`, `portafolio/slug/index.html`, etc.) → `backend/templates/frontend/`
  Served by `frontend_views.py` which reads them as raw `HttpResponse` (bypasses Django template engine to avoid conflicts with Next.js inline JS curly braces)
- `_next/` static assets (JS, CSS, images) → `backend/static/_next/`
  Served by Nginx in prod; by Django URL pattern (`re_path(r'^_next/...'`) in debug mode

The `build_to_django.sh` script in `frontend/` (run as `npm ci && bash build_to_django.sh`) automates the export and copy.

### SingletonModel: Use `.load()`, Never `.create()`
`SiteSettings`, `HomePage`, and `AboutPage` use `SingletonModel` which enforces `pk=1` on save. Always access via `cls.load()`:
```python
settings = SiteSettings.load()  # ✅
settings = SiteSettings.objects.get(pk=1)  # works but not the intended API
settings = SiteSettings.objects.create(...)  # ❌ will conflict with pk=1
```

### Slug Auto-Generation
Slug-bearing models (`Category`, `Style`, `Space`, `Project`, `Tag`, `Post`, `Service`, `ProcessStep`) override `save()` to call `generate_unique_slug(Model, name, instance_pk)`. This generates a slug from the `name` field with collision resolution. **Do not set slugs manually** unless testing.

### GalleryField Is Partially Integrated
`Project`, `Service`, `Post`, `HomePage`, `AboutPage` declare `GalleryField`/`SingleImageField` from `django_attachments`. However, the serializers do not yet uniformly expose gallery URLs. Before assuming a gallery field is accessible via the API, check the serializer.

### No Service Layer
`core_app/services/` directory exists but is intentionally empty. Business logic lives in serializers and view methods. The codebase is small enough that a service layer would be premature abstraction.

### Direct Requirements and Full Constraints
`backend/requirements.txt` is the source of direct dependency ranges and loads
`backend/constraints.txt`, which pins the complete tested Python 3.12 graph.
Dependency maintenance uses one dependency per commit with a full green PR CI
gate between commits. Resolver-inseparable additions, such as
`typing_extensions` introduced by django-redis 7, belong to the parent
dependency's commit.

Django 6.1 requires MySQL 8.4+. The fleet host was upgraded from MySQL 8.0.46
to 8.4.11 on 2026-08-27 after a clean official preflight and verified logical
restore, so Tenndalux can use `Django>=6.1,<6.2` safely. Validate the exact
target patch too: the 8.4.10 upgrade checker did not flag that
`binlog_transaction_dependency_tracking` is gone in 8.4.11. Running
`mysqld --validate-config` caught it before applications were reopened.

---

## Frontend Patterns

### El static export fija el destino de la API
Las variables `NEXT_PUBLIC_*` se incorporan al JavaScript al construirlo;
no cambian al reiniciar Django. Un fallback local en producción dirige las
solicitudes al equipo del visitante. Compartir resolución y guard con el
config del build evita repetir el error; validar además el recurso publicado.

### Auth Hydration Is Not Automatic
Zustand's `persist` middleware stores tokens in localStorage, but localStorage is not accessible during SSR. Components reading auth state must call `useAuthStore.hydrate()` in a `useEffect` before accessing the store:
```tsx
useEffect(() => { useAuthStore.hydrate() }, [])
```
Forgetting this causes a hydration mismatch: SSR renders "not logged in" state, client immediately re-renders with auth state.

### Axios Interceptor Handles Refresh Transparently
The `lib/services/http.ts` interceptor:
1. Injects `Authorization: Bearer <token>` on every outgoing request (from `js-cookie`)
2. On 401: attempts refresh, retries original request, then redirects to `/auth/login` on failure

Components never need to handle token refresh manually. Never bypass with raw `fetch()` or `axios`.

### Static Export Constraints on Data Fetching
Because `output: 'export'` is set, Server Components only run at build time. Any data that can change without a rebuild must be fetched client-side (`'use client'` component with a `useEffect`). There is no `getServerSideProps`, no server actions, no route handlers.

---

## Development Workflow

### Virtual Environment Location
The venv is at `backend/venv/`. Always activate from the `backend/` directory:
```bash
cd backend && source venv/bin/activate
```
Never activate from the repo root.

### Fake Data Commands
For seeding development data:
```bash
python manage.py create_fake_data --users 10
python manage.py delete_fake_data --confirm
```

### Test Discipline
- Run only the changed test file, never the full suite
- Max 20 tests per batch, 3 commands per cycle
- `pytest.ini` uses `core_project.settings` (SQLite, not MySQL) for all tests
- Use `FIXED_NOW` + `monkeypatch` when production code calls `timezone.now()` internally — avoids test flakiness

### Live Environment Discipline
The deploy environment (`vps-projectapp-staging`) is live and client-facing; deploys are operator-run only, via the `/deploy-and-check` flow. Never do the following autonomously:
- Run `systemctl restart tenndalux_project` or `tenndalux-huey`
- Run `python manage.py migrate` against the live database
- Push deploys

---

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Django project module | `core_project` (not `tenndalux_project`) | `DJANGO_SETTINGS_MODULE=core_project.settings_prod` |
| Django app | `core_app` | `AUTH_USER_MODEL = 'core_app.User'` |
| systemd services | `tenndalux_project.service` (gunicorn), `tenndalux-huey.service` (huey) | `sudo systemctl restart tenndalux_project` |
| Frontend stores | camelCase | `authStore.ts` |
| Frontend components | PascalCase | `Header.tsx` |
| Frontend pages | kebab-case folder + `page.tsx` | `portafolio/[slug]/page.tsx` |
| Frontend hooks | `use` prefix + camelCase | `useScrollAnimation.ts` |

---

## Known Tech Debt

### Reglas comprobadas en la ronda 2 — 2026-10-02

- Validar el tipo real de cada texto JSON antes de guardarlo. `str(value)`
  convierte objetos y null en aparentes textos y deja un contrato que React
  no puede cumplir. Generar la guía desde los mismos validadores.
- El guardado de un contacto y su aviso por correo tienen resultados distintos.
  Un fallo de cola posterior al guardado debe conservar el éxito de captura;
  registrar sólo el tipo de error, sin copiar el mensaje del proveedor.
- La precarga de relaciones no elimina consultas de ContentImage realizadas
  desde campos personalizados. Resolver los IDs para la página completa y
  delimitar el mapa a esa representación, incluso con serializers anidados.

- `GalleryField` integration incomplete — serializers don't yet uniformly expose gallery URLs
- `next-intl` is configured but most components still hardcode Spanish strings — migration in progress
- The frontend build → deploy step (`build_to_django.sh`) is operator-run — no automation beyond the script itself
- Playwright E2E profiles are Desktop Chrome only — mobile/tablet not yet configured
- No CI deploy pipeline — all deployments are operator-run (via the `/deploy-and-check` flow)
- `core_app/services/` is empty — no service layer tests needed yet
