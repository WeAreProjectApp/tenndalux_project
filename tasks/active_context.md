# Active context

## Monitoreo local — 2026-09-19

Exportación semanal Silk agrupada y sin SQL/valores URL para el módulo de
monitoreo de ProjectApp. Muestreo acotado y cuerpos HTTP deshabilitados; no se
modificó `.env` ni se activó Silk. El rollout pertenece al deploy autorizado y
mantiene el correo. Detalle: `docs/monitoring-export.md`.

## Tarea actual — ronda de mejora 2 (2026-10-02)

Rama propia `fix/02102026-improvement-tenndalux-round2`, base `master`.
Tres causas: validación de bloques anidados, tolerancia a fallo de cola tras
guardar contactos y consultas constantes en listados. El PR #59 sigue siendo
de la ronda anterior; esta rama no incorpora sus cambios.

Diagnóstico SQL aislado: proyectos 8→122, posts 6→82 y contactos 5→62 consultas
para poblaciones 1→20. Se usan SQLite en memoria y dependencias de pruebas
existentes sin modificarlas. La aplicación está completa; el diagnóstico
optimizado obtiene proyectos 6→6, posts 4→4 y contactos 3→3 consultas.
Las 18 regresiones iniciales pasan. Falta una sola QA de backend/gate sobre
commit limpio; entrega con PR abierto y CI verde.

Registros: ronda `improvement-20261002-round2` en el toolkit. No ejecutar
migraciones, sembrado, correos, deploy ni merge. No se amplía el cupo a deuda
de contraseñas, responsividad o paginación pendiente.

## Tarea anterior — payloads estáticos

Publicar correctamente los payloads RSC del static export. El helper nuevo
copia 44 `.txt` con su estructura de rutas, elimina generados obsoletos y está
cubierto por una regresión hermética. El build real confirma
`servicios/__next._tree.txt`, `portafolio/__next._tree.txt` e `index.txt` bajo
`backend/static`; falta únicamente entregar el PR verde, sin deploy.

## Previous task

Finish the 17-package Python upgrade by removing the final Django 6.1 blocker.
The follow-up is isolated in its own PR and contains one dependency commit.

## Contexto anterior — actualización de dependencias

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
