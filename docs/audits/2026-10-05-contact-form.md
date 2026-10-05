# Formulario de asesoría — 2026-10-05

## Resultado funcional

Preguntas opcionales de cantidad de espacios y ubicación del proyecto, antes
del botón de envío. Cantidad es un entero entre 1 y el límite de almacenamiento
2147483647; ubicación es texto libre de hasta 120 caracteres. La omisión no
bloquea el envío ni altera clientes anteriores. `city` se reutiliza y
`spaces_count` se agrega nullable mediante 0006, sin backfill. API, Django Admin
y aviso por correo conservan ambas respuestas. Un error conserva el formulario;
el éxito lo limpia. No se amplía la gestión de leads del dashboard frontend.

## Diagnóstico corroborado

GET de `https://tenndalux.com/_next/static/chunks/2-5tjtz-rt7eg.js` mostró
`let tq="http://localhost:8000/api"` y `axios.create({baseURL:tq})`.
El chunk de Contact usa ese cliente para `/leads/leads/`. GET de
`https://tenndalux.com/api/health/` respondió 200, environment=production.
El GET anónimo de leads devolvió 401, esperado para lectura de CRM; no se usó
como prueba del POST. No se enviaron leads reales ni se leyeron datos privados.

El cliente ahora usa `/api` por defecto en producción y localhost sólo en
desarrollo. La misma función se evalúa al cargar el config de Next: un destino
local o HTTP bloquea el export antes de tocar la copia publicada. Un origen
HTTPS explícito sigue siendo posible. El guard vive en el proyecto.

## Ronda improvement-pass

ID de ronda: `contact-form-20261005`. Snapshot de diagnóstico: `4ad7396`.
La selección se obtuvo por `improvement-ledger.sh --refresh --check`, sin
guardar estado ni locks. Se aplican las tres obligaciones seleccionadas:

| Frente | ID / decisión | Evidencia y alcance |
|---|---|---|
| Observabilidad | I-O-d0345673edcd | API local corroborada en bundle; resolución HTTP/config del export |
| Responsividad | I-R-778cc38e5ebf | MOD-2/FORM-2: foco del diálogo, controles de 44px, scroll interno |
| Responsividad | I-R-c26aa5bae0a8 | FORM-1: nombre y apellido a ancho completo en portrait |
| Seguridad | Sin causa nueva demostrada | Conservar restricciones de CRM y no registrar datos de contacto |
| Mantenibilidad | Pendiente fuera del cupo | Divergencia de límites de campos anteriores |
| Rendimiento | Sin cambio justificado | Create no escala con población; cola/SMTP ya aislados |

Las preguntas son funcionalidad solicitada y no rellenan el cupo de mejoras.
Otros pendientes: diferenciación segura de errores del servidor y dependencia
del POST público de cookies JWT vencidas. No se altera su contrato en esta ronda.
No se declara suficiencia global del proyecto ni auditoría de dependencias.

## Validación y entrega

QA único delegado, con capas backend/unit/E2E y gate canónico. Los cores del
toolkit se ejecutan en lectura con reportes dentro del worktree: el operador
prohibió cambios al toolkit, por lo que no se ejecutan `--record`, `--record-qa`
ni el wrapper de QA que guarda reportes/memoria allí. El registro de esta ronda
queda en este documento; artefactos reales en `test-results/contact-form/`.

Validación inicial: 9 casos backend, 19 unit y 10 E2E sobre el export local
(sin skips, fallos ni reintentos). Gate estricto con lint: 6 archivos, 40 tests
estáticos, 100/100 y cero hallazgos. La parametrización explica la diferencia
entre conteo estático y ejecuciones. TypeScript y ESLint de código nuevo pasan.
El build con `/api` compila 13 páginas; el build con localhost falla al cargar
el config, antes del export. El código se verificará de nuevo tras el commit.

La ejecución en navegador detectó pérdida de foco al deshabilitar el submit;
el diálogo recibe ahora una referencia explícita al botón para restaurarlo.
Las mediciones portrait esperan estabilidad de animaciones. Auditoría de flujos:
contacto pasa a covered con
success/error/failure; total 3 covered / 23 missing / 0 junk-only, sin cerrar
deuda de otros módulos. Registro y tags: 26/26 sincronizados.

La auditoría de pruebas separó contratos de las dos respuestas por
parametrización y sustituyó el test de ModelForm heredado por HTTP real del
admin en `tests/views/test_admin.py`, dentro del área admitida por el contrato
del proyecto para pruebas HTTP. La autoría final pasó 12 casos backend y
20 unit, conservando los 10 E2E; la verificación final limpia agrega regresión
de SMTP/cola, formulario anterior y renovación JWT. Sus artefactos se asocian
al SHA probado en `test-results/contact-form/verification.json`.

### Corrección de la inicialización detectada por CI

El primer CI dejó Nombre vacío tras llenar los demás campos y el envío no
abrió diálogo: el HTML exportado admitía entrada antes de que React conectara
los controles. El formulario ahora agrupa los controles en un fieldset
deshabilitado hasta el primer effect, conservando tamaños y separación.
El test de dos renovaciones espera el cierre del diálogo y el retorno del foco
antes de llenar una segunda solicitud; la lógica JWT permanece igual.

Los tests del contacto entran por `/#contacto`: probar el menú animado del
Header es otro flujo, que conserva su brecha y no recibe crédito. Esto evita
mezclar su inicialización con la captura. Se conservaron campos, payloads,
resultados, matrices y reglas de validación; sin force clicks, incremento de
timeouts ni retries. Revalidación del fix: fallos exactos 2/2 y ambos specs
12/12, sin skips, fallos ni flaky. Artefactos `e2e-heal*.json` en el worktree.

El Engineer E2E no pudo abrirse por límite de threads; el conductor escribió
la spec siguiendo el brief del Architect. Backend y unit fueron escritos por
sus Engineers; auditoría y verificación se mantienen como roles de lectura.

Ruff amplio de código histórico encontró avisos preexistentes en admin,
serializers y tareas; ESLint del wrapper HTTP encontró sus `any` preexistentes.
No se reformatea esa deuda. El gate con lint sobre las pruebas de la ronda no
presenta hallazgos. No se cambian baselines ni estándares.

La entrega exige PR verde; el operador pidió después ejecutar
`$merge-when-green`. No se cambia el clon de deploy. Publicar exige migración
0006 antes de reiniciar backend/Huey y reconstruir el frontend con
`NEXT_PUBLIC_API_URL=/api` o la variable ausente. El build/deploy, migraciones
y reinicios son operator-run. La comprobación posterior de URL del bundle es
de lectura; una prueba de captura se hace sólo en entorno local aislado.
