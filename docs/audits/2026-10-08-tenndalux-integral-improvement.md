# Ronda integral de Tenndalux — 2026-10-08

## Alcance aprobado y diagnóstico

El operador pidió diagnóstico previo de seguridad, mantenibilidad, observabilidad,
rendimiento, responsividad y QA, implementación repartida en t11/t22/t33, PR por
sesión e integración por merge-queue. Eligió todos los frentes con brechas y
cerrar los 24 flujos E2E pendientes. La base auditada es
`5c627bbfe0ecb3e57cde4df952e1253372d28fbb`, master remoto; el clon del servicio
está seis commits atrás y permanece intacto.

Los cinco exploradores de lectura cubrieron los frentes con máximo cuatro
simultáneos; QA se auditó junto con responsividad. No se declaró madurez global:
seguridad omite validadores de contraseña; catálogos excluyen destacados y
páginas siguientes; detalles confunden fallo temporal con ausencia; dos PNG
de respaldo exceden el presupuesto; portada consulta relaciones por fila;
navegación/formulario/modal incumplen reglas responsive; mapa vigente registra
6 flujos covered y 24 missing. Estos conteos describen el inventario previo,
no acreditan ejecución posterior.

## Coordinación y ownership

Se usan worktrees separados y ramas `improve/security` (conductor),
`improve/responsive` (t11), `improve/maintainability` (t22),
`improve/observability` (t33). El nombre fue pedido explícitamente por el
operador; no se modificó el helper para admitirlo. Los encargos completos y
paths exclusivos están en los cuatro documentos `improve-20261008-*.md`.
Conductor conserva archivos compartidos, Git de su rama y todos los registros;
cada apoyo implementa y entrega su propio PR, override explícito al modelo de
una sola rama de improvement-pass. El alcance ampliado se conserva en registros
vinculados de hasta tres causas, sin alterar el motor ni fingir una selección
automática global mayor.

La transición de t11 a ejecución se realizó por `thread/settings/update` del
App Server: modo default, modelo y esfuerzo conservados e instrucciones built-in.
No se cambiaron sandbox, approvals ni instrucciones de seguridad. t22 y t33
también confirmaron ejecución antes de escribir. No se usó al operador como relé.

## Causas y cambios previstos/aplicados

| Frente | Causa y dueño | Evidencia inicial |
|---|---|---|
| Seguridad | Validadores de registro — conductor | auth_serializers.py:19,39; settings.py:109 |
| Seguridad | Next dev MCP permite lectura entre orígenes — conductor | Next 16.3.3, npm audit y advisory mantenedor |
| Seguridad | Header JWT anidado escapa como RecursionError — conductor | PyJWT 2.13.0, renovación por body y reproducción aislada |
| Mantenibilidad | Destacados excluidos antes de filtros — t22 | blog/page.tsx:76; portafolio/page.tsx:146 |
| Mantenibilidad | Primera página presentada como catálogo completo — t22 | content.ts:39; API PageNumberPagination tamaño 20 |
| Observabilidad | Todos los errores de detalle se convierten en missing — t33 | BlogPostClient.tsx:40; PortafolioProjectClient.tsx:34 |
| Rendimiento | Respaldos PNG pese a WebP existente — t22 | 1249976/2147238 frente a 89762/143994 bytes |
| Rendimiento | Relaciones de destacados sin precarga — t33 | GET home: consultas 8→103 para 1→20 destacados |
| Responsividad | Menú desktop en portrait y controles 40 — t11 | Header md:flex/md:hidden; NAV-1/2/5 |
| Responsividad | Registro y foco del modal — t11 | FORM-6; VideoModal sin contención/restauración |
| QA | 24 flujos sin specs conductuales — tres apoyos | USER_FLOW_MAP y registro vigente |

El conductor aplica `validate_password` con usuario no persistido y traduce
validación a errores de password, sin cuenta/tokens en rechazo. Primer slice:
10 pruebas ejecutadas en verde; esa autoría previa no sustituye la evidencia
final asociada al commit limpio. Gate backend del archivo: 100/100, cero
hallazgos, lint real con ruff existente.

Next y eslint-config-next pasan a 16.3.8; se conserva el export estático. El
lockfile se regenera con Node 22/npm 10.9.4. La resolución conserva los paquetes
ajenos; actualiza familia Next, un patch transitivo fastq del árbol ESLint y
añade metadatos de paquetes WASM ya bundled por Tailwind.

PyJWT pasa exclusivamente de 2.13.0 a 2.14.0, primer parche de la cabecera JWT
anidada. Reproducción en memoria con SimpleJWT produjo RecursionError antes
de la firma, también mediante POST de refresh por body. No se demostró caída de
worker ni bypass de firma. Se probará rechazo controlado junto con renovación,
expiración, firma y revocación por jti.

La configuración del gate `frontend_unit_dir` pasa de `app/__tests__` a `.`:
los tests co-localizados de páginas, componentes y servicios estaban fuera de
su inventario. No se rebajan severidades ni baseline. t22 puede cambiar su CTA
Ver Productos en Servicios a `/productos`: el flujo era inalcanzable desde UI;
conserva la sección existente y lo acredita con navegación real.

## Validación y aislamiento

No .env enlazados, DB real, correos externos, migrate, deploy ni restart. Pruebas
con development y SQLite temporal explícitos; instalaciones sólo en worktrees
propios. Máximo veinte casos por ejecución, dos specs y tres comandos por ciclo;
un worker de navegador. Se cerró únicamente el npm ci del conductor para reducir
contención, identificando su PID/cwd antes de terminarlo; procesos ajenos intactos.

El bridge Admin de t33 usa un servidor pytest-django vivo, DB/media temporales,
login y uploads reales. Falta de entorno o pruebas skipped no acredita cobertura.
Después del parche, 15 casos backend pasaron y el gate estricto de ambos archivos quedó sin hallazgos. El token anidado falla de verdad antes del parche y se rechaza después. El export Next 16.3.8 compiló y generó las trece páginas estáticas; doce casos unitarios de configuración/portada pasaron. npm audit ya no señala Next ni avisos critical; continúan 42 entradas de otras dependencias. Auditoría Python queda en seis advisories sin camino demostrado tras corregir el header.

La QA conjunta final y el tren validarán el SHA combinado; este reporte permanece
en implementación hasta incorporar resultados exactos de todos los PRs.

## Pendientes y decisiones de parada

Se preservan controles ya corregidos: roles CMS, campos internos, refresh
single-flight, guardado de leads ante caída de cola, logs SMTP/Silk saneados,
consultas constantes de listas y fotografías WebP de galería.

Auditoría Python inicial completa de constraints: 18 advisories en tres paquetes.
La cabecera JWT es aplicable; los de GIS, JWKS, mezcla de algoritmos y streaming
HTTP no tienen camino demostrado en el proyecto. Otros avisos frontend/dev
requieren evaluación de entrada/alcance; Jest major no está autorizado en este
arreglo. Medición de JS inicial y vídeos fuera de pantalla continúa pendiente.
No se usa ausencia de evidencia ni cupo como declaración de madurez.

## Fuentes de dependencias

- [Next dev MCP y condiciones](https://github.com/vercel/next.js/security/advisories/GHSA-39w2-rjm5-chcv).
- [Versión Next corregida](https://github.com/advisories/GHSA-39w2-rjm5-chcv).
- [PyJWT cabecera anidada, primer parche 2.14.0](https://github.com/jpadilla/pyjwt/security/advisories/GHSA-8wjv-2p76-3863).

## Entrega

Pendiente: publicar PRs verdes, ejecutar QA única y auditoría de flujos sobre la
combinación, drenar mediante merge-queue y verificar con all-in-base --check-only.
No se declara desplegado ni terminado el trabajo por existir autoría de tests.
