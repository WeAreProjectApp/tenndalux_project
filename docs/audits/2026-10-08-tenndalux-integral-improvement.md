# Ronda integral de Tenndalux — 2026-10-08

## Alcance aprobado y diagnóstico

El operador pidió diagnóstico previo de seguridad, mantenibilidad, observabilidad,
rendimiento, responsividad y QA, implementación repartida en t11/t22/t33, PR por
sesión e integración por merge-queue. Eligió todos los frentes con brechas y
cerrar los 24 flujos E2E pendientes. La base auditada es
`5c627bbfe0ecb3e57cde4df952e1253372d28fbb`, master remoto; el clon del servicio
está seis commits atrás y permanece intacto.

Los cuatro exploradores de lectura cubrieron los frentes con máximo cuatro
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

Los seis frentes se clasificaron **CON BRECHAS** antes del reparto. No hubo
un frente global MADURO; sí controles locales ya verificados que se preservan.
Cada conclusión anterior señala el mecanismo o medición que la fundamenta.

El conductor aplica `validate_password` con usuario no persistido y traduce
validación a errores de password, sin cuenta/tokens en rechazo. Primer slice:
10 pruebas ejecutadas en verde; esa autoría previa no sustituye la evidencia
final asociada al commit limpio. Gate backend del archivo: 100/100, cero
hallazgos, lint real con ruff existente.

Next y eslint-config-next pasan a 16.3.8; se conserva el export estático. El
lockfile se regenera con Node 22/npm 10.9.4. La resolución conserva los paquetes
ajenos; actualiza familia Next, un patch transitivo fastq del árbol ESLint y
añade metadatos de paquetes WASM ya bundled por Tailwind.

La comprobación HTTP real de `/_next/mcp` en Next 16.3.8 rechaza origen
externo y `Origin: null` con 403; el cliente local completa initialize con
200. Los tres casos pasan contra servidor exclusivo del worktree, sin
navegador ni servicios externos. Se desactiva `agentRules` porque el arranque
añadía un bloque generado al AGENTS.md canónico; sólo se retiró ese bloque
producido por esta sesión, preservando exactamente las instrucciones previas.

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

## Entregas de aplicación y ampliaciones justificadas

| Dueño | PR / snapshot recibido | Cambios y verificación de autoría |
|---|---|---|
| Conductor | [#67](https://github.com/WeAreProjectApp/tenndalux_project/pull/67), 54952e7 | Registro, PyJWT 2.14.0 y Next 16.3.8; 15 backend, 3 peticiones MCP, 12 unitarias y export de trece páginas. CI seis checks verdes. |
| t11 | [#68](https://github.com/WeAreProjectApp/tenndalux_project/pull/68), f631cc1 | Menú, inicialización de sesión, formularios y vídeos; 29 unitarias, 62 E2E locales y CI seis checks verdes. |
| t22 | [#66](https://github.com/WeAreProjectApp/tenndalux_project/pull/66), e889900 | Catálogos completos, filtros, paginación acotada, CTA y WebP; 63 unitarias, 27 E2E propios y gate 100/100. Único rojo remoto en galería heredada, dependencia visible de #68. |
| t33 | [#69](https://github.com/WeAreProjectApp/tenndalux_project/pull/69), 64c6be8 | Detalles, FAQ, consultas y Admin; 10 backend, 33 unitarias, siete Admin finales en 90ba42e y dos navegaciones de título en 64c6be8. CI final seis checks verdes, 62 E2E. |

Admin añadió dos causas reproducidas, con ownership exclusivo de t33 aprobado
por el conductor. El uploader enviaba el formulario pese a rechazo de archivo;
ahora anuncia el error, conserva los datos y permite seleccionar reemplazo.
La eliminación de miniaturas usaba el path de backend deprecado como alias
STORAGES y devolvía 500 al reemplazar imágenes; usa el proveedor real de
easy_thumbnails, probado con originales/miniaturas y almacenamiento legítimo.
No se alteraron settings globales ni dependencias para esconder el problema.

El CI reveló además metadata de Next sobrescribiendo el título del detalle.
El observador de t33 conserva el título sólo mientras corresponde a la ruta
activa y se desconecta al salir. Dos pruebas de sobrescritura fallaron antes;
las 18 de detalles/títulos pasaron después, con DOM real y navegación sin
restaurar títulos antiguos. El E2E mantiene el límite de cinco segundos.

En la ejecución Admin, un filtro con anclas no excluyó una prueba cuyo título
completo incluía archivo/tags: el cuarto intento de PDF corrió por error y
pasó. Se conserva el incidente, sin atribuirle permiso retroactivo. Después
se enumeró la selección antes de cada lote. Save/Retry se detuvieron al agotar
el límite de fix-broken-tests, se diagnosticó la causa real y el conductor
documentó una única excepción acotada de verificación dentro del encargo
autorizado; siete casos finales pasaron. No hubo bucle adicional ni cambios
contra servicios o datos reales.

La auditoría sobre las fuentes combinadas registra **30/30 flujos covered**,
**58 outcomes**, cero missing/partial/junk-only. Este dato acredita autoría,
no runtime combinado. Home Admin declara también failure y lo prueba con
navegador offline, alerta, datos retenidos y recuperación online, sin POST
simulado. El mapa conserva los treinta IDs y documenta CRUD Admin fuera de
alcance y N/A de los tres módulos locales sin negativos propios.

El conductor prepara el gate ampliado y el mapa/documentación en el tren.
Tras integrar los apoyos, entregará el mismo patch por #67, verificando que
el árbol final coincida con el conjunto probado. Los registros de hasta tres
causas comparten una única QA; IDs previos de errores de contenido y N+1 de
Home se reutilizan y sus aliases duplicados quedan descartados por el helper.

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

Aplicación publicada en los cuatro PR anteriores. El estado de integración
se consulta en esos PR y en el draft temporal de la queue. QA única conserva
ejecuciones del commit limpio en test-results/improve-20261008-final y el
reporte del toolkit; la queue se cierra con all-in-base --check-only y
comprobación del árbol remoto. Este checkpoint no declara runtime conjunto ni
despliegue por existir autoría. Deploy, migraciones y reinicios siguen siendo
acciones del operador fuera de esta ronda.
