# Productos y favicon — puesta en servicio

## Entrega y destino

El cambio se entrega en un PR de sesión hacia `master`. El destino vigente es
`vps-projectapp-prod`, proyecto `tenndalux_project`, dominio `tenndalux.com`.
El merge, deploy, las migraciones, permisos de la cuenta y cualquier recarga de
Nginx son operaciones del operador. No ejecutar migraciones desde el worktree.

## Publicación

1. Integrar por la cola/operador y ejecutar el deploy autorizado. Incluye las
   migraciones 0008/0009: modelo y 15 productos. No descarga imágenes externas
   ni modifica registros de portafolio, servicios, contactos o usuarios.
2. Conservar las credenciales y los permisos actuales de la cuenta existente.
   Añadir únicamente `core_app.view_product` y `core_app.change_product`, después
   de las migraciones. No conceder altas, bajas ni permisos de categorías por
   esta funcionalidad; no convertir la cuenta en superusuario.
3. El build publica el ICO en estáticos y actualiza los enlaces del HTML a
   `/static/favicon.ico?v=tenndalux-2`. `collectstatic` lo copia al destino público.
4. Incorporar **sólo** la regla `location = /favicon.ico` preparada en
   `scripts/nginx/tenndalux.conf` al vhost vigente, sin reemplazar el archivo del
   servidor por la plantilla histórica (dominio/socket/rutas pueden diferir).
   Validar configuración antes de la recarga manual de Nginx.
5. Ejecutar el diagnóstico existente de entrega para la cuenta real; ahora
   también verifica los dos permisos de Productos. El diagnóstico es read-only.

## Comprobación funcional

- Entrar con la cuenta del cliente: siguen disponibles sus módulos anteriores
  y aparece Productos con 15 fichas, búsqueda por nombre y filtro por categoría.
- Abrir un producto: sólo se editan nombre, categoría, descripción e imagen.
  Las cinco categorías están predefinidas y no hay alta/baja de productos.
- Cambiar una ficha y guardar. Volver a cargar Productos y Servicios: ambos
  muestran la misma presentación, incluyendo la foto, título y cotización.
  La nueva categoría determina su filtro en Productos. Servicios conserva la
  sección original de cada tipo de solución. Restaurar los valores si la
  modificación fue sólo una prueba autorizada.
- «Ideal para», opciones y especificaciones permanecen como estaban. Las
  imágenes admitidas son JPG/JPEG/PNG/WebP/GIF de hasta 5 MB. Retirar una foto
  subida recupera la original; una carga inválida no sustituye la imagen actual.
- Abrir el favicon estático: debe responder 200 con el ICO de la marca.
  `/favicon.ico` debe redirigir al mismo destino después de aplicar la regla.
  Comprobar también en una pestaña nueva para evitar el icono antiguo en caché.

## Compatibilidad y reversión

La API pública es de sólo lectura; los cambios de ficha no requieren rebuild.
La API devuelve todos los 15 productos en una consulta y evita almacenar
respuestas en caché. Un fallo de lectura se muestra con Reintentar.

Las migraciones son aditivas y se puede volver al código anterior sin borrar
los productos o sus imágenes. No revertir las tablas ni borrar media para
volver a la versión anterior; conservar los cambios del cliente.
