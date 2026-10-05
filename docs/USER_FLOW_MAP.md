# Mapa de flujos de usuario — Tenndalux

Actualizado: 2026-10-05. Inventario del código real reconciliado durante la integración de las tres rondas.

## Roles

| Rol | Alcance real del frontend |
|---|---|
| Guest | Navega el sitio público, consulta contenido, envía contactos, inicia sesión y se registra. |
| Viewer | Comparte el sitio público y puede ver su perfil en Dashboard. |
| Editor | Comparte los flujos de Viewer. No existe un CMS en el frontend para editar contenido. |
| Admin | Comparte los flujos de Viewer. No existe un CMS en el frontend para administrar contenido o contactos. |

Los roles persistidos son `viewer`, `editor` y `admin`; `guest` es el visitante sin sesión.
El Dashboard sólo muestra el perfil y permite salir. Un superusuario usa la misma superficie
del frontend que Admin. Los permisos CRUD del CMS se prueban en backend; este mapa no inventa
controles de frontend para esas APIs. Django Admin queda fuera del alcance de esta ronda.

## Conventions

- `success`: acción completada; `error`: validación o guard de acceso; `failure`: petición o integración fallida; `display`: datos concretos alcanzados mediante navegación UI.
- Las clases no declaradas son N/A según las razones de **Clases no aplicables**.
- Cada entrada describe una interacción real del frontend con un resultado concreto. Los permisos de API pertenecen a pruebas de backend.
- Los E2E de esta ronda usan fixtures, cookies locales y rutas HTTP interceptadas, sin acceder al despliegue ni a datos de producción.

## Guest

Guest usa navegación pública, catálogos, blog, portfolio, videos, FAQ, formulario de contacto,
registro, login y el guard de Dashboard. Los enlaces externos se validan sin operar al proveedor.
El índice siguiente enumera cada interacción y sus clases.

## Viewer

Viewer usa la superficie pública y, con sesión, ve su perfil y puede cerrar sesión.
Cuando el acceso vence durante el envío de contacto, ese formulario ejercita la renovación
y repetición de la solicitud. El índice diferencia este resultado del envío público ordinario.

## Editor

Editor comparte los flujos visibles de Viewer. El frontend no renderiza controles de edición
de contenido; su autorización para escribir se verifica en backend.

## Admin

Admin comparte los flujos visibles de Viewer. El frontend no renderiza controles de administración
de contenido ni contactos; la autorización de API, incluido el superusuario, se verifica en backend.

## E2E Coverage Index

El audit estático de esta ronda registra **2 covered · 24 missing · 0 junk-only**.
La tabla es también la matriz de interacciones por vista. El crédito del audit reconoce el spec;
la ejecución real y sus resultados se conservan por separado en el reporte de QA.

| Flujo | Módulo | Rol | Clases | Interacción y resultado | Audit |
|---|---|---|---|---|---|
| `auth-login` | auth | guest | success, error, failure | Submit credentials; success reaches Dashboard, invalid credentials show an error, transport failure keeps the form usable. | missing |
| `auth-register` | auth | guest | success, error, failure | Submit registration for a viewer account; validate duplicate email and password confirmation; show request failure. | missing |
| `dashboard-unauthenticated-redirect` | auth | guest | error | Open Dashboard without session and reach Login. | missing |
| `dashboard-profile-display` | dashboard | viewer, editor, admin | display | Reach Dashboard after Login and read fixture-backed profile values. | missing |
| `dashboard-logout` | dashboard | viewer, editor, admin | success | Activate Logout and reach Login with auth cookies cleared. | missing |
| `public-home` | public | guest, viewer, editor, admin | display | Reach the landing through site navigation and read landing content, including responsive gallery images and the project-video modal. | covered |
| `public-header-navigation` | public | guest, viewer, editor, admin | success | Use header desktop or mobile navigation to reach a public route or contact anchor. | missing |
| `public-contact-submit` | leads | guest, viewer, editor, admin | success, error, failure | Complete labeled contact form; valid capture shows success, required fields prevent invalid submission, rejected requests show recoverable error dialog. | missing |
| `auth-session-refresh-contact` | auth | viewer, editor, admin | success, failure | Seed stale access_token and valid refresh_token cookies locally; submit contact, renew both tokens on 401, replay unchanged payload and confirm success. Rejected refresh clears cookies and redirects to Login. | covered |
| `public-faq-toggle` | public | guest, viewer, editor, admin | success, display | Activate a question to read its answer and activate again to collapse. | missing |
| `public-gallery-video` | public | guest, viewer, editor, admin | success, display | Open a gallery video card, read the modal player and close using the video close control. | missing |
| `public-brand-video` | public | guest, viewer, editor, admin | success, display | Open Why Tenndalux video and close modal. | missing |
| `public-products-display` | products | guest, viewer, editor, admin | display | Reach Products through navigation and read static product cards. | missing |
| `public-products-filter` | products | guest, viewer, editor, admin | success | Choose category and read matching product cards. | missing |
| `public-product-details` | products | guest, viewer, editor, admin | success, display | Select Ver Detalles, read chosen product details and close modal. | missing |
| `public-services-display` | services | guest, viewer, editor, admin | display | Reach Services and read initial curtain solution. | missing |
| `public-services-tab` | services | guest, viewer, editor, admin | success | Choose Cortinas, Recubrimientos, Exteriores or Tecnología; choose curtain model where offered. | missing |
| `public-services-exterior-mobile-detail` | services | guest, viewer, editor, admin | success, display | Open mobile exterior card, read bottom sheet and close by backdrop. | missing |
| `public-blog-list` | blog | guest, viewer, editor, admin | display, failure | Navigate to Blog, read API-backed cards; failed request settles to no results. | missing |
| `public-blog-filter` | blog | guest, viewer, editor, admin | success, display | Search or choose tag, read matching cards or no results, then clear filters. | missing |
| `public-blog-detail` | blog | guest, viewer, editor, admin | display, failure | Follow article card and read title/content; missing or unavailable article shows return state. | missing |
| `public-blog-share` | blog | guest, viewer, editor, admin | success, failure | Activate Compartir using native share or clipboard fallback; rejected browser integration has no visible feedback. | missing |
| `public-portfolio-list` | portfolio | guest, viewer, editor, admin | display, failure | Navigate to Portfolio and read API-backed cards; failed request settles to no results. | missing |
| `public-portfolio-filter` | portfolio | guest, viewer, editor, admin | success, display | Choose category, read matching projects or no results, reset to Todos. | missing |
| `public-portfolio-showreel` | portfolio | guest, viewer, editor, admin | success, display | Open showreel, select next or previous video, close overlay. | missing |
| `public-portfolio-detail` | portfolio | guest, viewer, editor, admin | display, failure | Follow project card and read title/content; missing or unavailable project shows return state. | missing |

## Clases no aplicables

- Catálogos estáticos, acordeones, tabs, showreels y modales locales: error/failure N/A porque no exponen petición o validación remota; la carga de media no tiene UI de error propia.
- Listados y detalles API: error/success de escritura N/A, son lectura. Filtros locales: error/failure N/A.
- Login/registro: display N/A, el perfil pertenece a Dashboard. Guard de Dashboard: sólo error, sin vista persistente.
- Dashboard: success pertenece a logout; error/failure de carga de perfil N/A en la página actual. Logout es local y no tiene error/failure.
- Contacto: display N/A, no es vista de datos. Renovación durante contacto: success/failure, sin validación propia de formulario.
- Handoffs a WhatsApp, correo, teléfono, redes y PDFs: validar enlaces en pruebas de componentes cuando cambien; no operar proveedores externos.

## Evidencia de mapa

Fuente: `frontend/app/**/page.tsx`, `frontend/components/{home,layout,servicios}/`,
`frontend/lib/services/http.ts` y `frontend/lib/services/leads.ts`. Se preservan `auth-login`
y `public-home`; el registro previo sólo contenía esos dos flujos.

Antes de esta ronda sólo existía `frontend/e2e/smoke.spec.ts`. La auditoría actual reconoce
`public-home` y `auth-session-refresh-contact`; el resto queda pendiente. La combinación
incorpora `gallery-media.spec.ts`: sus diez casos cubren imágenes reales y apertura/cierre
del video en cinco anchos, etiquetados como display de `public-home`; no conceden crédito
al flujo separado `public-gallery-video` sin su tag específico. Las constantes de tags
y la sincronización del registro no son evidencia de ejecución. Esta ronda valida únicamente
las causas seleccionadas; los demás huecos son deuda pendiente.

## Selectores y entorno

Formularios: `getByLabel`; botones/enlaces: `getByRole`. El feedback de contacto usa
`role=dialog` y cierre `aria-label=Cerrar`. Videos con div clickeable y botones sin nombre
requieren nombres accesibles antes de autoría futura. Los E2E de la ronda usan endpoints
interceptados y cookies de fixture locales; nunca datos o servicios de producción.
