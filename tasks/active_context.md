# Active context

## Requisitos del cliente — 2026-10-06

Rama propia `feat/06102026-cms-client-requirements`, base `origin/master`.
Implementar PDFs públicos de garantía y edición de la portada; corregir el
favicon. Blog/portafolio ya están fusionados. SMTP y la cuenta del cliente se
verifican sin exponer secretos; cambios de producción, merge y deploy quedan
para el operador. Respuesta final mediante `$client-response`, para enviar
únicamente tras comprobar la publicación.

## Contexto anterior — formulario de asesoría (2026-10-05)

Trabajo aislado en `fix/05102026-contact-form`, desde `origin/master`.
El operador eligió dos preguntas opcionales: cantidad entera de espacios y
ubicación libre. Ubicación usa `city`; `spaces_count` es nullable y requiere la
migración aditiva 0006. Ambas respuestas viajan al CRM y al aviso de correo.

El bundle público inspeccionado por GET incorporaba `http://localhost:8000/api`.
El cliente ahora usa `/api` por defecto en producción y el config de Next
rechaza un destino local antes de exportar. Desarrollo conserva su API separada.
La ronda también corrige foco/controles del diálogo y ancho de inputs en portrait.
La validación inicial pasó: 9 casos nuevos backend, 19 unit, 10 E2E sobre el
export local y gate estricto con lint disponible sin hallazgos. Queda la
ejecución final sobre commit limpio y CI, sin solicitudes reales al sitio ni
correos externos.

El CI detectó que el HTML aceptaba la primera entrada antes de hidratar.
La corrección conserva el formulario deshabilitado hasta conectar sus handlers.
Reenvío espera el cierre real del diálogo antes de llenar otra solicitud;
dos specs de contacto/JWT pasaron 12/12 tras la corrección. CI se debe repetir
sobre el commit corregido antes del merge.

No se modifica el toolkit: motor de mejora en preview, cores de QA con resultados
en este worktree y reporte en `docs/audits/2026-10-05-contact-form.md`.
El cierre autorizado es PR verde seguido de `$merge-when-green`, solicitado
expresamente por el operador. Deploy y migración siguen siendo operator-run.

## Monitoreo local — 2026-09-19

Exportación semanal Silk agrupada y sin SQL/valores URL para el módulo de
monitoreo de ProjectApp. Muestreo acotado y cuerpos HTTP deshabilitados; no se
modificó `.env` ni se activó Silk. El rollout pertenece al deploy autorizado y
mantiene el correo. Detalle: `docs/monitoring-export.md`.

## Tarea anterior — integración de tres rondas (2026-10-05)

El tren integra los PRs #61, #59 y #60 sobre master desde un worktree propio
queue-*. La combinación conserva permisos por rol del CMS, captura pública de
contactos restringida y renovación JWT; validación de bloques, tolerancia a
fallos de cola y consultas constantes; diagnósticos SMTP/Silk sin datos privados
y cinco imágenes WebP de la galería.

Cada PR llegó con sus seis checks verdes. La validación conjunta está pendiente
en el draft de integración antes de drenar los tres PRs mediante squash.
Las mediciones de la segunda ronda fueron proyectos 8→122, posts 6→82 y
contactos 5→62 consultas para poblaciones 1→20; tras optimizar, 6→6, 4→4 y 3→3.
Las imágenes de la tercera ronda bajaron de 9.09 MB a 0.55 MB en conjunto.

Se conservan los registros y pruebas de ambas ramas al resolver conflictos,
y los 26 flujos E2E incorporan la descripción de galería de la tercera ronda.
Los reportes originales de las rondas conservan su evidencia en el toolkit;
esta integración no modifica ese repo. Sin migraciones, sembrado, correos,
deploy ni ampliación del alcance a las ramas históricas.

La publicación de payloads RSC del static export ya quedó integrada en la base.

## Previous task

Finish the 17-package Python upgrade by removing the final Django 6.1 blocker.
The follow-up is isolated in its own PR and contains one dependency commit.

## Contexto histórico de la actualización de dependencias

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
