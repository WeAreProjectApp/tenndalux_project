# Entrega de requisitos Tenndalux — 06/10/2026

## Estado y límites

Base comprobada: `origin/master` en `bb23a1d` (incluye PR #63).
Blog y portafolio ya tienen administración, portadas, contenido por bloques y
publicación sin reconstruir el frontend. Esta entrega agrega garantías,
conecta la imagen principal del Home y reemplaza el favicon genérico por la
T del logotipo original. La política PDF existente conserva su URL.

El destino vigente del fleet es `vps-projectapp-prod`, proyecto
`tenndalux_project`, dominio `https://tenndalux.com`. La documentación antigua
de staging no se usa como coordenada de despliegue.

La sesión entrega PR abierto + CI verde. Merge, migración 0007, deploy,
edición de `.env`, permisos y reinicios son operaciones del operador. No se
corren migraciones sobre producción desde el worktree.

## Configuración privada del correo

En `backend/.env` del servidor, conservar todas las variables ajenas y definir:

```dotenv
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=solicitudeswebtenndalux@gmail.com
DEFAULT_FROM_EMAIL=solicitudeswebtenndalux@gmail.com
LEADS_NOTIFICATION_EMAILS=solicitudeswebtenndalux@gmail.com
EMAIL_TIMEOUT=10
```

`EMAIL_HOST_PASSWORD` se introduce por el canal privado con la contraseña de
aplicación que ya entregó el operador, sin espacios de presentación. Nunca
se guarda en git, este documento, el PR, el correo ni WhatsApp. No es la
contraseña del administrador.

Aplicar la configuración dentro del deploy autorizado, incluyendo backend y
Huey. La cola debe ejecutar la misma versión y configuración que el backend.

## Cuenta existente y verificación

Buscar exclusivamente la cuenta `solicitudeswebtenndalux@gmail.com`.
No cambiar su contraseña ni crear otra cuenta automáticamente. El acceso
requiere cuenta activa, `is_staff` y permisos de Django, no sólo el rol de la
API. La comprobación siguiente no modifica datos:

```bash
backend/venv/bin/python backend/manage.py check_client_delivery --email solicitudeswebtenndalux@gmail.com --smtp-login
```

Ejecutar desde el clon de deploy de `tenndalux_project` en
`vps-projectapp-prod`, después de publicar la migración y recargar servicios.
La salida muestra permisos pendientes y claves de configuración faltantes,
sin mostrar valores secretos. `--smtp-login` conecta/autentica, pero no envía
mensajes. Si falta la cuenta, el operador decide cómo recuperar su acceso.

Permisos necesarios: ver/agregar/cambiar Posts, Projects, Tags, Categories,
Styles, Spaces y Documentos de garantía; ver/cambiar Home pages; acceso a
Libraries y Attachments para cargar, ordenar y retirar imágenes. No requiere
dar acceso a usuarios, CRM ni convertirlo en superusuario.

El acceso al servidor no pudo verificarse desde el entorno de desarrollo:
no tiene una clave SSH de host validada para producción. No se declara
comprobada la cuenta ni configurado el SMTP por tener el código listo.

## Publicación y comprobación final

1. Integrar el PR por la cola/operador y ejecutar el deploy autorizado.
2. Aplicar la migración de documentos de garantía en el deploy.
3. Comprobar acceso del cliente y correo con el comando anterior.
4. Abrir `/garantias/` desde «Garantía» en el pie de página: la política sigue
   disponible; cada documento publicado muestra su título y abre su PDF.
5. Cambiar la imagen principal en Home pages y comprobarla en una nueva visita
   al inicio. Sin imagen o con un archivo roto se conserva el fondo original.
6. Abrir `/favicon.ico?v=tenndalux-1`: debe responder 200 con la T de la marca.
7. El operador envía una solicitud de prueba autorizada y confirma recepción
   en el Gmail indicado. Si falla el correo, la solicitud permanece en Leads.

## Documento y comunicaciones

Aplicar `$client-response` en modo documento con notas privadas: respuesta a
los seis puntos, guías y textos de correo/WhatsApp. Usar el dominio real y los
botones del admin, incluyendo el editor de bloques y sus cargas de fotos.
La comunicación describe la entrega y se envía sólo después de comprobar
los pasos anteriores. No contiene secretos ni afirma verificaciones pendientes.
Si no está disponible el Gestor, devolver el contenido al operador e indicar
que no quedó persistido; no guardar la respuesta comercial en este repo.
