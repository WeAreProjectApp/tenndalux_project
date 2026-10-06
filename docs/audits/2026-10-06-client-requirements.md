# Requisitos del cliente — verificación local del 06/10/2026

## Alcance

Trabajo en `feat/06102026-cms-client-requirements`, worktree propio, desde
`origin/master` (`bb23a1d`). La administración de Blog y Portafolio, el editor
de bloques y las notificaciones del formulario ya existen en esa base.
Esta entrega implementa documentos públicos de garantía, conecta la imagen
principal del Home y sustituye el favicon genérico por la T del logotipo.

La sesión entrega un PR abierto con CI verde. No integra en master, modifica
el clon de deploy, aplica migraciones ni reinicia servicios. La configuración
privada de producción y el acceso de la cuenta existente quedan para el
operador, según `docs/client-delivery-operations.md`.

## Comportamientos comprobados

| Frente | Resultado |
|---|---|
| Garantías en Admin | Un PDF válido se guarda con título, orden y publicación. Extensión incorrecta, encabezado inválido y archivo mayor de 5 MB se rechazan sin crear registros. |
| Catálogo público | Sólo devuelve documentos publicados, en orden numérico con desempate alfabético. No expone campos internos ni admite POST/PUT/PATCH/DELETE. |
| Imagen Home | La API devuelve la URL del adjunto principal o null. Hero usa esa imagen y conserva el fondo original ante fallo de API o del archivo. |
| Diagnóstico operativo | Cuenta inexistente no se crea; configuración errada identifica sólo la clave; un error SMTP no muestra detalles privados. La autenticación opcional no envía correo. |
| Navegación | Footer lleva a Garantías; el visitante abre el PDF, lee el vacío y recupera un error mediante reintento. Header lleva al Home y muestra la imagen del CMS. |
| Favicon | Export y copia para Django contienen el archivo de marca; la metadata lo referencia con versión. HTTP local devuelve 200. |

## Ejecución acotada

No se corrió la suite local completa. Ningún lote supera 20 casos. Backend
usa `DJANGO_ENV=development`, SQLite de test y un entorno Python aislado;
los E2E usan el export local con respuestas HTTP/PDF fixture, sin cuentas,
datos ni solicitudes de producción.

| Capa | Evidencia local | Resultado |
|---|---|---|
| Backend | `test-results/cms/backend.xml` | 15/15 |
| Parametrizados ajustados | `test-results/cms/backend-parametrized.xml` | 7/7; subconjunto de los 15, no casos adicionales |
| Frontend unit | `test-results/cms/unit.json` | 6/6 |
| E2E | `test-results/cms/e2e.json` | 6/6 |
| Regresión E2E en Next dev | `test-results/cms/e2e-dev-regression.json` | 6/6 en 46,9 s; mismos casos, no pruebas adicionales |
| Gate canónico | `qa-agent.sh --verify`, unión de cinco archivos | Cero errores y warnings; marker retirado por el engine |
| Revisión de pruebas | Auditoría de los cinco archivos nuevos | APPROVED; sin junk, duplicación ni ubicación incorrecta |
| TypeScript y ESLint | Archivos afectados | Passed |
| Esquema | `makemigrations --check --dry-run` | Sin cambios pendientes después de generar 0007; sin ejecutar migrate |
| Export real y copia | `NEXT_PUBLIC_API_URL=/api bash build_to_django.sh` | 13 páginas, 48 payloads; plantilla de Garantías y favicon copiados |

La primera ejecución detectó fixtures y expectativas incorrectas de las
pruebas: archivo de imagen inexistente, URL optimizada por Next/Image,
comportamiento del visor PDF headless, selector de alerta ambiguo y una espera
que aceptaba cualquier ruta con slash final. Se corrigieron sólo los tests.
El gate final usa su configuración canónica: el Ruff genérico no aplica la
misma convención para los valores externos de `parametrize`.

Se corrigió `.testquality.yml` para incluir `.test.tsx` y `.spec.tsx`; las dos
pruebas React nuevas ahora se analizan. También se revisó el archivo de Home
preexistente que empezó a entrar en ese gate: sin hallazgos automáticos.

La ejecución local acredita el contenido del worktree previo al commit.
El CI del PR acredita el commit publicado; su estado se consulta en los checks
del PR y no se deduce de los resultados locales.

La primera ejecución del PR #64 pasó backend, unit y gates, pero detectó dos
expectativas de fixtures incompatibles con Next dev y React StrictMode: cambiar
la respuesta del catálogo por cantidad de peticiones y exigir un único GET del
Home. El catálogo conserva el error hasta observar la alerta y cambia a éxito
antes del reintento; Home acredita una respuesta 500 real y el respaldo visible,
sin imponer cardinalidad. La navegación espera la URL raíz exacta con margen
para la compilación inicial. Los seis casos pasan en Next dev y la auditoría
confirma que las assertions conservan el comportamiento. No cambió la aplicación.

## Auditoría final de flujos

`flow_coverage_audit.py` registra 30 flujos: **5 covered, 25 missing,
0 junk-only**. Los dos flujos públicos de esta entrega tienen evidencia E2E
calificable y ejecución verde. El sincronizador de definiciones/tags reconoce
los 30 identificadores; esa coincidencia sola no concede cobertura.

Los dos flujos nuevos de Django Admin continúan sin pruebas de navegador.
La carga de PDFs se prueba por HTTP real del Admin; Home sólo tiene pruebas
de su lectura/serialización y de la imagen pública. No se atribuye cobertura
administrativa a esos tests. Las brechas anteriores del sitio y de la edición
de Blog/Portafolio no se declaran cerradas. El favicon es un artefacto estático,
no un flujo de usuario.

## Pendientes operativos

1. Integrar el PR y desplegar por el procedimiento del operador, incluyendo
   la migración 0007 y el export/copia de assets.
2. Configurar Gmail en el `.env` privado y recargar backend/Huey. La clave ya
   recibida nunca se escribe en el repo, este reporte ni los borradores.
3. Ejecutar `check_client_delivery --email solicitudeswebtenndalux@gmail.com
   --smtp-login` desde el servidor y comprobar cuenta, permisos y autenticación.
   No crear/restablecer una cuenta automáticamente si no existe.
4. Confirmar recepción de una solicitud autorizada y probar garantías, imagen
   Home y favicon en `https://tenndalux.com`.
5. Enviar el documento y las comunicaciones sólo después de esas comprobaciones.

El destino vigente del fleet es producción en `vps-projectapp-prod`; el acceso
SSH no pudo verificarse desde este entorno porque falta una clave de host
validada. No se afirma comprobada la cuenta ni la recepción real.

La respuesta comercial se preparó con `$client-response` en modo documento con
notas, fuera del repo. Sin conector del Gestor de Documentos, se devuelve el
contenido al operador y no se declara guardado o enviado en ProjectApp.
