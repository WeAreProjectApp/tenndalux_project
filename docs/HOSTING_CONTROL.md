# Control visual de hosting · PA-264

Adaptador de protocolo 1, compartido con ProjectApp. Desactivado por defecto.

El deploy autorizado configura `HOSTING_CONTROL_ENABLED=true`, `HOSTING_CONTROL_TARGET=tenndalux_project` y `HOSTING_CONTROL_STATE_FILE=/var/lib/projectapp-hosting/tenndalux_project.json` exclusivamente en producción. No se alteraron .env ni servicios. El receptor del toolkit mantiene el archivo con reemplazo atómico, comprueba el documento público y confirma versión/huella para cada dominio. DEV/STAGING no se inscriben.

Pantalla: reemplaza documentos públicos y vistas autenticadas con respuesta 503; conserva APIs/webhooks y administración Django. Banner: mantiene contenido y funcionamiento. El script común conserva el modo al navegar y consulta cada 10 s; el último estado válido persiste durante desconexión. Retirada mediante el Panel central, nunca editando archivos locales. No se detiene el runtime ni se cambian datos.

Validación: pruebas focales en CI; QA manual, despliegue y comprobación de consumo real pendientes por pausa vigente. En producción autorizada comprobar normal/banner/pantalla, cambios de texto, enlaces internos, recargas, dos proyectos, vistas abiertas, móvil/escritorio y retorno a normal. La presencia del código no acredita instalación ni aplicación.

El banner limita su altura y mantiene el texto completo desplazable. Las cabeceras y menús fijos usan `data-hosting-offset` o `--hosting-banner-height` (cero sin aviso) para preservar sus controles.
