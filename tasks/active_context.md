# Active context

## Monitoreo local — 2026-09-19

Exportación semanal Silk agrupada y sin SQL/valores URL para el módulo de
monitoreo de ProjectApp. Muestreo acotado y cuerpos HTTP deshabilitados; no se
modificó `.env` ni se activó Silk. El rollout pertenece al deploy autorizado y
mantiene el correo. Detalle: `docs/monitoring-export.md`.

## Current task

Publicar correctamente los payloads RSC del static export. El helper nuevo
copia 44 `.txt` con su estructura de rutas, elimina generados obsoletos y está
cubierto por una regresión hermética. El build real confirma
`servicios/__next._tree.txt`, `portafolio/__next._tree.txt` e `index.txt` bajo
`backend/static`; falta únicamente entregar el PR verde, sin deploy.

## Previous task

Finish the 17-package Python upgrade by removing the final Django 6.1 blocker.
The follow-up is isolated in its own PR and contains one dependency commit.

## Current step

The shared server was upgraded from MySQL 8.0.46 to 8.4.11 after 12/12 database
restore tests; all seven consumers are healthy and 580/580 database objects
pass `mysqlcheck`. Django is now pinned to 6.1. The remaining action is to push
the single commit and require green PR CI; do not merge or deploy from
this session. The local gate is complete: exact resolution, zero outdated
packages, clean `pip check`/`pip-audit`, no model changes, MySQL-backed
production check, 7 focused tests, and 4 mailer tests with Django 7.0
deprecations treated as errors.

## Guardrails

- Never mutate the deploy clone's venv or production database.
- Resolve and test packages in an isolated temporary Python 3.12 venv.
- Django 6.1 must only deploy while the server remains on MySQL 8.4+.
- Do not proceed to the next dependency while PR CI is red or pending.
