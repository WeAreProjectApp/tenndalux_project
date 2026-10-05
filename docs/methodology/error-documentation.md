# Error Documentation — Tenndalux

### [ERR-009] Formulario publicado enviaba a localhost
- **Date**: 2026-10-05
- **Context**: El visitante veía «No pudimos enviar tu solicitud».
- **Root Cause**: GET del chunk `2-5tjtz-rt7eg.js` servido por `tenndalux.com`
  mostró `http://localhost:8000/api` como base de Axios; el sitio dirigía la
  captura al equipo del visitante. La API pública respondió a health con 200.
- **Resolution**: `/api` por defecto en producción, configuración local sólo
  para desarrollo y guard previo al static export para destinos no aptos.
  La publicación de la corrección requiere build/deploy del operador.

This file tracks known errors, their context, and resolutions. When a non-trivial bug is fixed during development, document it here.

### [ERR-001] Route-scoped Next payloads returned 404
- **Date**: 2026-08-29
- **Context**: `/servicios/__next._tree.txt` and equivalent route payloads.
- **Root Cause**: the deploy script copied only root-level `.txt` files.
- **Resolution**: recursively mirror every exported `.txt` while preserving its
  relative path; nginx serves nested `__next*`/`index.txt` payloads as static.
- **Files Affected**: frontend deployment helper, regression harness and nginx
  configuration in `vps-ops-toolkit`.

---

## Format

```
### [ERR-NNN] Short title
- **Date**: YYYY-MM-DD
- **Context**: Where/when this error occurs
- **Root Cause**: Why it happens
- **Resolution**: How to fix it
- **Files Affected**: List of files
```

---

## Known Issues

_None currently._

---

## Resolved Issues

### [ERR-004] Operaciones del CMS sólo comprobaban autenticación
- **Date**: 2026-10-02
- **Context**: Una cuenta viewer creada mediante registro público podía escribir
  contenido/configuración y leer contactos privados. La captura pública también
  aceptaba estado y notas internos del CRM.
- **Root Cause**: Permisos sin comprobación del rol y serializer compartido entre
  captura pública y administración.
- **Resolution**: Permisos centralizados editor/admin para contenido y admin para
  contactos/singleton, con compatibilidad de superusuario. Serializer público
  separado que rechaza campos internos; administración conserva PATCH.

### [ERR-005] Renovación JWT reutilizaba el refresh revocado
- **Date**: 2026-10-02
- **Context**: La segunda renovación podía finalizar una sesión válida, y varios
  401 concurrentes reutilizaban la misma credencial.
- **Root Cause**: El cliente descartaba el refresh rotado y cada petición
  iniciaba su propia renovación, sin el timeout de la instancia central.
- **Resolution**: Guardar ambos tokens, compartir una renovación por pestaña,
  aprovechar tokens ya renovados en respuestas tardías y limitar reintentos/red.

### [ERR-006] Texto anidado incompatible con el renderer
- **Date**: 2026-10-02
- **Root Cause**: El validador convertía valores anidados con str y aceptaba
  objetos/null; un type lista/objeto además causaba TypeError.
- **Resolution**: Validar textos y claves desde una definición compartida,
  duration opcional explícita y tipos malformados como errores acumulados.
  Esquema/guía usan las mismas reglas. No se modifica contenido guardado.

### [ERR-007] Error de cola después de persistir un contacto
- **Date**: 2026-10-02
- **Root Cause**: La llamada a Huey se propagaba tras serializer.save().
- **Resolution**: Aislar sólo el despacho secundario, conservar 201 y contacto,
  registrar el tipo de error sin datos sensibles. Sin retry ni correo inline.

### [ERR-008] Consultas por elemento en los listados
- **Date**: 2026-10-02
- **Root Cause**: Serializers consultaban relaciones e imágenes por objeto.
- **Resolution**: Precargar relaciones y resolver imágenes de bloques una vez
  por lista, conservando datos y fallback individual. La medición inicial de
  poblaciones 1→20 fue proyectos 8→122, posts 6→82 y contactos 5→62 consultas.
  El detalle y la cardinalidad de destacados mantienen revisión separada.

### [KNOWN-001] Project suspension (RESOLVED 2026-05-07)
- **Date**: 2026-03-17 → 2026-05-07
- **Context**: Services stopped 2026-03-17 due to non-payment. MySQL database and media files were preserved throughout.
- **Resolution**: Payment resolved 2026-04-22; project reactivated 2026-05-07 as `tenndalux_project_staging` on `vps-projectapp-staging`.

### [ERR-002] Python dependency drift exposed security advisories
- **Date**: 2026-08-27
- **Context**: The deployed Python 3.12 environment reported 17 outdated packages and 13 advisories across idna, pip, PyJWT, sqlparse, and urllib3.
- **Root Cause**: Direct dependency ranges had no versioned full-resolution constraints, allowing the deployed transitive graph to drift.
- **Resolution**: Added `backend/constraints.txt`, upgraded all 17 packages (including Django 6.1 after the MySQL 8.4.11 prerequisite), and verified the final graph with a clean install, `pip check`, `pip-audit`, focused tests, and per-commit CI gates.
- **Files Affected**: `backend/requirements.txt`, `backend/constraints.txt`, `.github/workflows/ci.yml`, `audit-report.md`

### [ERR-003] Removed MySQL option blocked the first 8.4.11 start
- **Date**: 2026-08-27
- **Context**: Fleet MySQL upgrade from 8.0.46 to 8.4.11, required by Django 6.1.
- **Root Cause**: MySQL Shell's 8.4.10 upgrade checker reported `binlog_transaction_dependency_tracking` as a changed-default variable, but MySQL 8.4.11 rejects it as unknown.
- **Resolution**: Removed the option from the temporary compatibility profile, reran `mysqld --validate-config`, started MySQL successfully, and verified the automatic server upgrade plus all 580 database objects before reopening applications.
- **Files Affected**: `/etc/mysql/mysql.conf.d/zz-mysql84-compat.cnf` (server configuration)
