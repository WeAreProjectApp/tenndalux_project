# Ronda integral aprobada — contexto común de implementación

El operador aprobó implementar todos los frentes con brechas y cerrar los 24 flujos E2E pendientes (30 declarados, 6 cubiertos). El conductor es la tarea Codex `01a11903-80db-7883-a003-22ffbadeef43`. Comunicarse directamente con ella; no usar al operador como relé.

> Eres IMPLEMENTADOR, no revisor. Tu entregable es un PR con cambios reales y pruebas, no un informe ni un plan. Si estás en modo plan, presenta tu plan una sola vez, espera aprobación y ejecútalo.

## Base, aislamiento y autoridad

Proyecto Tenndalux, repo WeAreProjectApp/tenndalux_project. Base auditada `master@5c627bbfe0ecb3e57cde4df952e1253372d28fbb`. Clon principal `/home/dev_env/webapps/tenndalux_project` está atrasado y es intocable. Resolver confirma `prod-direct`, base master, `host-na`, servicio en vps-projectapp-prod. Ningún acceso al servicio, DB real, SMTP, deploy o restart está autorizado. Nunca `manage.py migrate`: sólo tests con DB de test aislada.

Cada apoyo crea SU worktree mediante `git worktree add <ruta asignada> -b <rama asignada> <SHA base>`; la excepción de nombres `improve/<frente>` fue pedida y aprobada por el operador. El helper no admite ese prefijo; no editarlo ni reutilizar ramas ajenas. No enlazar .env ni venv del servicio. Todo comando y edición posterior con workdir propio. No estás solo: no restaurar/revertir cambios de otros dueños.

## Stack y convenciones reales

Django 6.1, DRF y SimpleJWT; proyecto core_project, app core_app; Next 16.3.3, React 19.2.8, TypeScript, App Router, output export; Zustand persist, Axios wrapper lib/services/http.ts; Tailwind y componentes propios. Código/identificadores y Conventional Commits en inglés; reportes en español. Preservar roles: viewer puede leer TODO contenido por contrato explícito, editor/admin escriben contenido; admin gestiona leads/singletons. No cambiar este contrato.

El conductor sube Next + eslint-config-next a 16.3.8 en SU PR. Apoyos no tocan manifiestos/lockfiles. Cada PR debe ser independiente y verde contra master, no depender de archivos sólo presentes en el PR del conductor. Nuevos textos usarán recursos locales del módulo si necesitan ampliación, sin editar diccionarios globales; consultar al conductor si requiere interfaz compartida.

## Propiedad

Conductor: serializer de registro y sus tests backend, dependencias/lockfiles, configuración global, diccionarios globales, mapas de flows, documentación y ledgers. Apoyos: únicamente aplicación y tests enumerados en su encargo. Lo demás es lectura. Si necesitas otro archivo, solicita al conductor ampliar ownership ANTES de editarlo. Nunca limpiar diffs ajenos ni instalar en su entorno.

## Pruebas y evidencia

Leer AGENTS.md de raíz y backend/frontend. Python aislado disponible `/tmp/tenndalux-cms-20261006-venv/bin/python` (comprobar imports/versiones; sólo lectura, no instalar ahí). Entorno de tests: DJANGO_ENV=development, DJANGO_DB_ENGINE=django.db.backends.sqlite3 y DJANGO_DB_NAME en un directorio temporal PROPIO; sin .env enlazado. Huey/mail/media deben aislarse para pruebas que lo requieran.

Backend: desde backend, `<python aislado> -m pytest <archivo o nodeids explícitos> -v`; máximo 20 casos por comando y 3 comandos por ciclo. No suite completa. Frontend: instalar npm ci sólo en TU frontend; Jest `npm test -- <archivo> --runInBand`; Playwright `npx playwright test <máximo dos specs> --workers=1`, ≤20 casos efectivos por ejecución. Servidor local sirve TU contenido; no reutilizar un puerto/proceso ajeno. Config temporal gitignored permite puerto propio sin editar config global. Arrancar Next puede agregar texto a frontend/AGENTS.md: conservar instrucciones, retirar sólo adición del runner demostrada como propia antes commit.

E2E debe usar FlowTags existentes + @outcome:success|error|failure|display; cada outcome declarado tiene interacción real y aserción concreta. No acreditan cobertura screenshots, sólo tags, skips o mocks de lógica interna. HTTP de API es frontera mockeable para UI pública; media real se comprueba cuando cambia. Admin debe usar navegador+servidor Django reales, no mocks de POST. Tokens/contraseñas sólo fixtures locales.

Artefactos en directorios gitignored propios, asociados al SHA final limpio: JUnit, JSON Playwright y gate. Tests deben fallar si el comportamiento corregido rompe; no reducir gates ni añadir skips/retries/baselines para ocultar fallos. Calidad mediante motor toolkit, instrucciones qa y TESTING_QUALITY_STANDARDS. QA combinada una sola vez por conductor, después de tests propios de implementación. No invocar cinco QAs globales independientes.

## Entrega

Cada apoyo posee Git en SU rama (override explícito al modo delegado estándar). Commit selectivo, primer push seguido de PR a master. Título `[frente] descripción corta`; body `Sesión: t11|t22|t33` e `Intención:` + qué cambió, por qué y cómo se verificó. CI verde en head y árbol limpio. No merge: conductor ejecutará merge-queue. Reportar URL, SHA, tests/comandos/artefactos y bloqueos directamente al conductor. Mantener worktree para fixes de queue; cerrar con all-in-base --check-only.

IMPROVEMENT_CONTEXT: conductor=improvement-pass; round_id=improve-20261008; project=tenndalux_project; codebase=tenndalux_project; base=master; mode=apply; owns_git=sesión dueña; registro=conductor. branch/projdir/candidate_ids/allowed_paths están definidos en cada encargo. Los IDs nuevos los registra el conductor; no escribir toolkit.
