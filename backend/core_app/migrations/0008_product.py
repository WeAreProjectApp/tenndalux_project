import core_app.models.products
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('core_app', '0007_warranty_documents')]

    operations = [
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True)),
                ('key', models.SlugField(editable=False, max_length=80, unique=True)),
                ('name', models.CharField(max_length=200, verbose_name='Nombre')),
                ('category', models.CharField(choices=[
                    ('cortinas-diseno', 'Cortinas de Diseño'),
                    ('soluciones-practicas', 'Soluciones Prácticas'),
                    ('persianas', 'Persianas'),
                    ('exteriores', 'Exteriores'),
                    ('recubrimientos', 'Recubrimientos'),
                ], max_length=30, verbose_name='Categoría')),
                ('description', models.TextField(verbose_name='Descripción')),
                ('image', models.ImageField(
                    blank=True,
                    help_text='JPG, PNG, WebP o GIF, hasta 5 MB. Sin reemplazo se usa la foto original.',
                    upload_to=core_app.models.products.product_image_path,
                    validators=[
                        core_app.models.products.validate_product_image_size,
                        django.core.validators.FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp', 'gif']),
                    ], verbose_name='Imagen',
                )),
                ('default_image', models.CharField(editable=False, max_length=300)),
                ('order', models.PositiveIntegerField(default=0, editable=False)),
            ],
            options={
                'verbose_name': 'Producto',
                'verbose_name_plural': 'Productos',
                'ordering': ('order', 'pk'),
            },
        ),
    ]
