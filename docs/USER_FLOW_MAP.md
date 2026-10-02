# Mapa de flujos de usuario — Tenndalux

Actualizado: 2026-10-02. Inventario del código real por el Analyst de QA.

La web pública permite navegar, consultar catálogos, enviar contactos y autenticarse.
El Dashboard sólo muestra el perfil y permite salir: no existe CMS de navegador.
Los roles reales son `viewer`, `editor` y `admin`; invitado es el visitante sin sesión.
Los permisos CRUD del CMS se prueban en backend, sin inventar E2E para una interfaz inexistente.

## Matriz de interacciones

`success`: acción completada; `error`: validación/acceso; `failure`: petición o integración fallida;
`display`: datos concretos alcanzados por navegación. Toda clase ausente es N/A según las razones siguientes.

| Flujo | Módulo | Rol | Clases | Interacción y resultado |
|---|---|---|---|---|
| `auth-login` | auth | guest | success, error, failure | Submit credentials; success reaches Dashboard, invalid credentials show an error, transport failure keeps the form usable. |
| `auth-register` | auth | guest | success, error, failure | Submit registration for a viewer account; validate duplicate email and password confirmation; show request failure. |
| `dashboard-unauthenticated-redirect` | auth | guest | error | Open Dashboard without session and reach Login. |
| `dashboard-profile-display` | dashboard | viewer, editor, admin | display | Reach Dashboard after Login and read fixture-backed profile values. |
| `dashboard-logout` | dashboard | viewer, editor, admin | success | Activate Logout and reach Login with auth cookies cleared. |
| `public-home` | public | guest, viewer, editor, admin | display | Reach the landing through site navigation and read landing content. |
| `public-header-navigation` | public | guest, viewer, editor, admin | success | Use header desktop or mobile navigation to reach a public route or contact anchor. |
| `public-contact-submit` | leads | guest, viewer, editor, admin | success, error, failure | Complete labeled contact form; valid capture shows success, required fields prevent invalid submission, rejected requests show recoverable error dialog. |
| `auth-session-refresh-contact` | auth | viewer, editor, admin | success, failure | Seed stale access_token and valid refresh_token cookies locally; submit contact, renew both tokens on 401, replay unchanged payload and confirm success. Rejected refresh clears cookies and redirects to Login. |
| `public-faq-toggle` | public | guest, viewer, editor, admin | success, display | Activate a question to read its answer and activate again to collapse. |
| `public-gallery-video` | public | guest, viewer, editor, admin | success, display | Open gallery video, read modal player and close it. |
| `public-brand-video` | public | guest, viewer, editor, admin | success, display | Open Why Tenndalux video and close modal. |
| `public-products-display` | products | guest, viewer, editor, admin | display | Reach Products through navigation and read static product cards. |
| `public-products-filter` | products | guest, viewer, editor, admin | success | Choose category and read matching product cards. |
| `public-product-details` | products | guest, viewer, editor, admin | success, display | Select Ver Detalles, read chosen product details and close modal. |
| `public-services-display` | services | guest, viewer, editor, admin | display | Reach Services and read initial curtain solution. |
| `public-services-tab` | services | guest, viewer, editor, admin | success | Choose Cortinas, Recubrimientos, Exteriores or Tecnología; choose curtain model where offered. |
| `public-services-exterior-mobile-detail` | services | guest, viewer, editor, admin | success, display | Open mobile exterior card, read bottom sheet and close by backdrop. |
| `public-blog-list` | blog | guest, viewer, editor, admin | display, failure | Navigate to Blog, read API-backed cards; failed request settles to no results. |
| `public-blog-filter` | blog | guest, viewer, editor, admin | success, display | Search or choose tag, read matching cards or no results, then clear filters. |
| `public-blog-detail` | blog | guest, viewer, editor, admin | display, failure | Follow article card and read title/content; missing or unavailable article shows return state. |
| `public-blog-share` | blog | guest, viewer, editor, admin | success, failure | Activate Compartir using native share or clipboard fallback; rejected browser integration has no visible feedback. |
| `public-portfolio-list` | portfolio | guest, viewer, editor, admin | display, failure | Navigate to Portfolio and read API-backed cards; failed request settles to no results. |
| `public-portfolio-filter` | portfolio | guest, viewer, editor, admin | success, display | Choose category, read matching projects or no results, reset to Todos. |
| `public-portfolio-showreel` | portfolio | guest, viewer, editor, admin | success, display | Open showreel, select next or previous video, close overlay. |
| `public-portfolio-detail` | portfolio | guest, viewer, editor, admin | display, failure | Follow project card and read title/content; missing or unavailable project shows return state. |

## Clases no aplicables

- Catálogos estáticos, acordeones, tabs, showreels y modales locales: error/failure N/A porque no exponen petición o validación remota; la carga de media no tiene UI de error propia.
- Listados y detalles API: error/success de escritura N/A, son lectura. Filtros locales: error/failure N/A.
- Login/registro: display N/A, el perfil pertenece a Dashboard. Guard de Dashboard: sólo error, sin vista persistente.
- Dashboard: success pertenece a logout; error/failure de carga de perfil N/A en la página actual. Logout es local y no tiene error/failure.
- Contacto: display N/A, no es vista de datos. Renovación durante contacto: success/failure, sin validación propia de formulario.
- Handoffs a WhatsApp, correo, teléfono, redes y PDFs: validar enlaces en pruebas de componentes cuando cambien; no operar proveedores externos.

## Evidencia y cobertura

Fuente: `frontend/app/**/page.tsx`, `frontend/components/{home,layout,servicios}/`,
`frontend/lib/services/http.ts` y `frontend/lib/services/leads.ts`. Se preservan `auth-login`
y `public-home`; el registro previo sólo contenía esos dos flujos.

La revisión es inventario, no cobertura acreditada. Antes de esta ronda sólo existía
`frontend/e2e/smoke.spec.ts`. El audit determinista posterior identifica missing/partial/covered;
las constantes de tags y la sincronización del registro no son evidencia de ejecución.
Esta ronda valida únicamente las causas seleccionadas; los demás huecos son deuda pendiente.

## Selectores y entorno

Formularios: `getByLabel`; botones/enlaces: `getByRole`. El feedback de contacto usa
`role=dialog` y cierre `aria-label=Cerrar`. Videos con div clickeable y botones sin nombre
requieren nombres accesibles antes de autoría futura. Los E2E de la ronda usan endpoints
interceptados y cookies de fixture locales; nunca datos o servicios de producción.

