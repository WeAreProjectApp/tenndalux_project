# Mapa de flujos de usuario — Tenndalux

Actualizado: 2026-10-08. Registro de las 30 interacciones aprobadas, contrastado
con el código real de los cuatro PR. El resto de operaciones del administrador
queda fuera del registro, sin declarar madurez global ni inventar exenciones.

## Roles

| Rol | Alcance real en navegador |
|---|---|
| Guest | Consulta web pública, catálogos, garantías, media y FAQ; envía contactos, inicia sesión y se registra. |
| Viewer | Comparte web pública; consulta su perfil y cierra sesión en Dashboard. |
| Editor | Comparte superficie visible de Viewer; no hay CMS en Next. |
| Admin | Comparte superficie de Viewer. Django Admin exige staff y permisos Django, independientes del rol JWT; staff viewer/editor con permisos también puede usarlo. |

## Convenciones

success: acción completada; error: validación o guard; failure: fallo de API,
transporte o integración; display: datos concretos alcanzados por navegación UI.
Covered es crédito estático para todos los outcomes, no ejecución sobre el SHA
combinado. Las clases ausentes están justificadas abajo; no hay expectedSpecs: 0.
Los E2E públicos interceptan API y leen media real. Admin usa login, SQLite/media
locales y uploads reales. Offline provoca caída de transporte del navegador,
sin fabricar POST exitoso ni usar datos del despliegue.

## Guest

Usa navegación, Home, FAQ, vídeos, catálogos, Blog, Portafolio, Garantías,
contacto, login, registro y guard de Dashboard. Servicios enlaza realmente a
Productos. Los enlaces externos se verifican sin operar al proveedor.

## Viewer

Usa la web pública, perfil y logout. Sesión vencida durante contacto renueva y
repite el payload; refresh rechazado limpia credenciales y llega a Login.
La inicialización real usa initializeAuth y rehidratación explícita; hydrate no
existe en el store.

## Editor

Comparte las interacciones visibles de Viewer. Escrituras y permisos de contenido
se prueban en backend; no existen controles CMS en Next.

## Admin

Con staff/permisos Django publica PDFs de garantía y cambia Hero media en el
administrador. Rechazo de imagen y caída de transporte conservan el formulario,
anuncian el fallo y habilitan recuperación. La media se guarda antes del
formulario: bloquearlo no ofrece atomicidad entre widgets ni rollback global.

## E2E Coverage Index

Auditoría de fuentes: **30 covered, 0 partial, 0 missing, 0 junk-only** y
**58 outcomes declarados**. Se examinaron 18 specs y 81 definiciones de tests;
casos expandidos por anchos/parámetros se cuentan en reportes de runtime.
El cierre de los 24 huecos originales exige también ejecución verde del conjunto.

| Flujo | Módulo | Roles | Clases | Interacción y resultado | Audit estático |
|---|---|---|---|---|---|
| `auth-login` | auth | guest | success, error, failure | Submit credentials; success reaches Dashboard, invalid credentials show an alert, and transport failure retains values for a retry. | covered |
| `auth-register` | auth | guest | success, error, failure | Submit viewer registration; duplicate email, password confirmation, and password-policy errors are shown; transport failure retains entered data for retry. | covered |
| `dashboard-unauthenticated-redirect` | auth | guest | error | Opening Dashboard without an initialized authenticated session redirects to Login. | covered |
| `dashboard-profile-display` | dashboard | viewer, editor, admin | display | Reach Dashboard through Login and read fixture-backed profile name, email, phone, and account status. | covered |
| `dashboard-logout` | dashboard | viewer, editor, admin | success, failure | Activate Logout, clear local authentication state and cookies, and return to Login; an earlier pending renewal cannot restore that session or overwrite a subsequent login. | covered |
| `public-home` | public | guest, viewer, editor, admin | display | Reach the landing through site navigation and read concrete landing content and real media. | covered |
| `public-header-navigation` | public | guest, viewer, editor, admin | success | Use desktop or compact-overlay navigation, including the Tenndalux WebP logo and Footer links, to reach public destinations or return Home. | covered |
| `public-contact-submit` | leads | guest, viewer, editor, admin | success, error, failure | Complete the labeled contact form; validate optional space count, submit optional project details, show success feedback, and preserve values after a rejected request. | covered |
| `auth-session-refresh-contact` | auth | viewer, editor, admin | success, failure | A stale access token refreshes and replays the unchanged contact request; rejected refresh clears tokens and redirects to Login. | covered |
| `public-faq-toggle` | public | guest, viewer, editor, admin | success, display | Open a FAQ question to read its answer and close it again. | covered |
| `public-gallery-video` | public | guest, viewer, editor, admin | success, display | Open a gallery video card, inspect its playable modal source, and close the dialog with focus restored. | covered |
| `public-brand-video` | public | guest, viewer, editor, admin | success, display | Open the Why Tenndalux brand video, inspect the native player, and dismiss the modal. | covered |
| `public-products-display` | products | guest, viewer, editor, admin | display | Reach Products from Services and read concrete product cards. | covered |
| `public-products-filter` | products | guest, viewer, editor, admin | success | Choose a product category and reset it to show the matching cards. | covered |
| `public-product-details` | products | guest, viewer, editor, admin | success, display | Open a product detail dialog, read data for the selected product, and close it. | covered |
| `public-services-display` | services | guest, viewer, editor, admin | display | Reach Services and read concrete initial solution content. | covered |
| `public-services-tab` | services | guest, viewer, editor, admin | success | Choose Cortinas, Recubrimientos, Exteriores, or Tecnología, including a curtain model where offered. | covered |
| `public-services-exterior-mobile-detail` | services | guest, viewer, editor, admin | success, display | Open an exterior solution card on mobile, read its bottom sheet, and close it by backdrop; resizing beyond the compact breakpoint or leaving the page closes the sheet and restores scrolling. | covered |
| `public-blog-list` | blog | guest, viewer, editor, admin | display, failure | Navigate to Blog, read API-backed cards including later pages or a valid empty state, and recover an initial or later-page API failure with retry. | covered |
| `public-blog-filter` | blog | guest, viewer, editor, admin | success, display | Search or choose a tag, read matching cards or the no-results state, then clear filters. | covered |
| `public-blog-detail` | blog | guest, viewer, editor, admin | display, failure | Follow an article card, read its title and content, and retain the matching browser title; a missing article returns to Blog and an unavailable request can retry. | covered |
| `public-blog-share` | blog | guest, viewer, editor, admin | success, failure | Share an article using native sharing or clipboard fallback; a denied browser integration leaves the article usable without an unhandled rejection. | covered |
| `public-portfolio-list` | portfolio | guest, viewer, editor, admin | display, failure | Navigate to Portfolio, read API-backed cards including later pages or a valid empty state, and recover an initial or later-page API failure with retry. | covered |
| `public-portfolio-filter` | portfolio | guest, viewer, editor, admin | success, display | Choose a category, read its projects, and reset to Todos. | covered |
| `public-portfolio-showreel` | portfolio | guest, viewer, editor, admin | success, display | Open the showreel, read its current video, choose next or previous video, and close the overlay. | covered |
| `public-portfolio-detail` | portfolio | guest, viewer, editor, admin | display, failure | Follow a project card, read its title and content, and retain the matching browser title; a missing project returns to Portfolio and an unavailable request can retry. | covered |
| `public-warranty-documents` | warranties | guest, viewer, editor, admin | success, failure, display | Reach Garantías through Footer, read published PDFs or the empty state and policy, open a document, and retry a failed list. | covered |
| `public-home-hero-image` | public | guest, viewer, editor, admin | failure, display | Navigate Home and display the API-backed hero image; absent, unavailable, or broken CMS media retains the bundled cover. | covered |
| `admin-warranty-document-publish` | django-admin | admin con staff/permisos Django | success, error, display | A staff user with Django model permissions creates a published PDF document, reopens its saved row and file, and sees validation for an invalid PDF. | covered |
| `admin-home-hero-image-update` | django-admin | admin con staff/permisos Django | success, error, failure, display | A staff user with Django attachment permissions uploads or selects Home hero media, sees the saved thumbnail, rejects a non-image, and recovers failed uploads or pending deletions without losing the intended change before retrying. | covered |

## Clases no aplicables

| Área | Clases N/A | Razón |
|---|---|---|
| Login/registro | display | El dato autenticado pertenece al perfil de Dashboard. |
| Guard Dashboard | success, failure, display | Denegación/redirect, sin pantalla de datos propia. |
| Perfil Dashboard | success, error, failure | No edita ni ofrece recuperación de carga propia; el guard es de auth. |
| Logout | error, failure, display | Limpieza local, sin petición o vista de datos nueva. |
| Navegación, FAQ, tabs, filtros y catálogos estáticos | error/failure según flujo | Interacción local sin validación ni petición remota propia. |
| Vídeos/modales locales | error, failure | No muestran recuperación propia de transporte; reproducción/media se verifican de verdad. |
| Contacto | display | Captura datos, no es listado o detalle. |
| Refresh durante contacto | error, display | Validación y feedback pertenecen al contacto. |
| Listas/detalles Blog y Portafolio | success, error | Lectura, sin escritura o formulario validable. |
| Filtros Blog y Portafolio | error, failure | Filtro local; fallo API pertenece a la lista. |
| Compartir Blog | error, display | Sin entrada validable o vista; rechazo de integración sí es failure. |
| Garantías público | error | Sin entrada del visitante; carga fallida sí es failure. |
| Hero público | success, error | No escribe; ausencia/API/media fallida activa fallback. |
| PDF de Django Admin | failure | Formulario estándar sin recuperación propia de transporte. |

Home uploader sí declara failure: HTTP/transporte fallido anuncia alerta, habilita
Save y permite reenviar o seleccionar otra imagen. El detector agrupa dashboard,
products y services como módulos sin negativos; las razones N/A anteriores
explican ese read-out, sin crear tags de resultados inexistentes.

## Evidencia de mapa

El renderer Django conserva title, description y Open Graph como texto literal
escapado en el HTML inicial de Blog/Portafolio. Cinco pruebas HTTP ejercen
barras inversas y escape HTML en las rutas reales; esto añade cobertura backend
sin crear ruta, control, outcome ni crédito E2E. Referencias:
`backend/core_app/views/frontend_views.py:44-73,96-136` y
`backend/core_app/tests/views/test_frontend_metadata_literals.py:27-104`,
comprobados en `9eb037bc1e01aedf49a00505f4fe06ce7fa1cefe`.

- Auth/menú/vídeos: PR #68, f631cc1bcd3d3c3a08b9fcd84d23b12233275417;
  authStore.ts:73, Header.tsx:160, VideoModal.tsx:34 y specs improve-responsive.
- Catálogos y Productos alcanzable: PR #66, e889900caf446745a72a3845ff2b2d5265bcbf97;
  services/content.ts, ambas listas, servicios/page.tsx:109 y improve-maintainability.
- Detalles/títulos/FAQ/adjuntos: PR #69, 64c6be842c7981de13a1943fe26781c1d2559c47;
  ambos Client, FAQ.tsx:73, admin_attachments.js:67, attachments.js:700,
  cleanup.py:40 y improve-observability.
- Registro: PR #67, auth_serializers.py:39.
- La auditoría mecánica y ejecución combinada se conservan por separado en
  test-results/improve-20261008-final y en el reporte QA del toolkit. Tags y
  capturas no sustituyen ejecución.

## Riesgos fuera del registro aprobado

Django Admin también gestiona usuarios, proyectos, posts, servicios, taxonomías,
leads, páginas y bloques (backend/core_app/admin.py:36). Esos CRUD no tienen ID
entre estos 30; pruebas HTTP no les conceden cobertura de navegador. El store
conserva actualización de perfil sin control UI en Dashboard: no se inventa flujo.
Permisos API preservados: viewer autenticado lee privados por contrato,
editor/admin escribe contenido y admin gestiona contactos/configuración.

## Selectores y entorno

Roles/labels predominan; test IDs identifican datos y tarjetas estables. El
widget de terceros requiere clases/inputs propios para archivo, miniatura y
validación. Matriz: 412×915, 835×1194, 1195×835, 1440×900 y 2560×1440.
Toda ejecución mutante sirve un worktree local con DB/media temporales, sin
.env, DB del despliegue, SMTP externo, migrate ni deploy.
