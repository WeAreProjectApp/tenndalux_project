# Task Plan — Tenndalux

## Ronda de mejora — 2026-10-02

- [x] Aplicar permisos por rol a las operaciones del CMS.
- [x] Rechazar campos internos en la captura pública de contactos.
- [x] Conservar refresh rotado y compartir recuperación entre solicitudes.
- [x] Incorporar pruebas conductuales de las tres causas y actualizar el mapa de flujos.

La ejecución final sobre el commit limpio y la entrega se acreditan en el
reporte `improvement-20261002` del toolkit: artefactos por capa, revisión de
pruebas, PR abierto y CI. La integración conjunta de las tres rondas se valida en el tren de la queue; el deploy pertenece al operador.

## Ronda de mejora 2 — 2026-10-02

- [x] Descubrir cinco frentes y seleccionar tres causas con el motor canónico.
- [x] Medir consultas reales en SQLite en memoria, sin producción.
- [x] Aplicar contrato de bloques, aislamiento de notificación y precarga de listas.
- [x] Cerrar una sola QA de backend y gate sobre el SHA definitivo.
- [x] Publicar registros y entregar PR abierto con CI verde, sin deploy.

## Ready for merge — static-export payload publication

- [x] Copiar recursivamente los `.txt` de Next conservando rutas.
- [x] Retirar payloads generados obsoletos sin tocar otros assets públicos.
- [x] Cubrir rutas anidadas y preservación de archivos con un harness hermético.
- [x] Ejecutar el build real: 44 payloads publicados; Servicios y Portafolio presentes.

## Backend dependency upgrade plan

Branch: `chore/27082026-django-6-1`

The 2026-08-27 audit found 17 outdated packages. Each item is delivered in its
own commit and must have a green PR CI run before the next item starts.

- [x] PyJWT 2.12.1 -> 2.13.0
- [x] pip 26.1.1 -> 26.2.1
- [x] urllib3 2.6.3 -> 2.7.0
- [x] idna 3.13 -> 3.19
- [x] sqlparse 0.5.5 -> 0.6.0
- [x] asgiref 3.11.1 -> 3.12.1
- [x] certifi 2026.4.22 -> 2026.7.22
- [x] charset-normalizer 3.4.7 -> 3.5.1
- [x] packaging 26.2 -> 26.3
- [x] Pygments 2.20.0 -> 2.21.0
- [x] pytz 2026.2 -> 2026.3.post1
- [x] wheel 0.47.0 -> 0.48.0
- [x] django-dbbackup 4.3.0 -> 5.3.0
- [x] django-redis 6.0.0 -> 7.0.0
- [x] huey 2.6.0 -> 3.3.4
- [x] redis 7.4.0 -> 8.1.0
- [x] Verify MySQL 8.0 -> 8.4 upgrade compatibility and rollback
- [x] Restore-test all 12 application databases
- [x] Upgrade shared MySQL 8.0.46 -> 8.4.11 and validate all consumers
- [x] Django 6.0.8 -> 6.1

Final gate: clean isolated install, `pip check`, `pip-audit`, no outstanding
package updates, focused backend tests, PR CI green, and no merge from this
session.
