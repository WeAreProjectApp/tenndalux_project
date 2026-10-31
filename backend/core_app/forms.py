from django import forms
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.safestring import mark_safe
from django_attachments.forms import RasterImageField

from core_app.models import Product


class ProductAdminForm(forms.ModelForm):
    image = RasterImageField(
        required=False, label='Imagen', help_text=Product._meta.get_field('image').help_text,
    )

    class Meta:
        model = Product
        fields = ('name', 'category', 'description', 'image')


class ContentBlocksWidget(forms.Textarea):
    """
    Textarea del JSON de bloques, con las herramientas alrededor.

    El HTML se arma con `render_to_string` y no con `template_name` a propósito:
    los templates de widget los resuelve el renderer de formularios, que por
    defecto no ve los directorios de las apps del proyecto. Llamando al loader
    directamente se usan los TEMPLATES del proyecto, que sí.
    """

    def __init__(self, kind, attrs=None):
        self.kind = kind
        defaults = {
            'rows': 22,
            'spellcheck': 'false',
            'class': 'vLargeTextField cb-textarea',
            'placeholder': '[\n  { "type": "parrafo", "text": "…" }\n]',
        }
        super().__init__({**defaults, **(attrs or {})})

    def render(self, name, value, attrs=None, renderer=None):
        return mark_safe(render_to_string('core_app/content_blocks_widget.html', {
            'kind': self.kind,
            'textarea': super().render(name, value, attrs, renderer),
            'instructions_url': reverse('content-blocks-instructions'),
            'upload_url': reverse('content-blocks-upload-image'),
            'validate_url': reverse('content-blocks-validate'),
        }))

    class Media:
        css = {'all': ('core_app/content_blocks.css',)}
        js = ('core_app/content_blocks.js',)
