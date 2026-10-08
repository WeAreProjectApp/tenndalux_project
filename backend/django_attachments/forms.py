# -*- coding: utf-8 -*-
from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.forms.models import modelformset_factory
from django.utils.translation import gettext_lazy as _

from .models import Attachment


class RasterImageField(forms.ImageField):
	"""Accept verified raster images without publishing executable file extensions."""
	default_validators = [
		*forms.ImageField.default_validators,
		FileExtensionValidator(
			allowed_extensions=('jpg', 'jpeg', 'png', 'webp', 'gif'),
			message=_("Seleccione una imagen JPG, JPEG, PNG, WebP o GIF."),
		),
	]
	default_error_messages = {
		'invalid_image': _("El archivo no es una imagen válida."),
	}

	def to_python(self, data):
		upload = super().to_python(data)
		if upload is not None and upload.image.format not in ('JPEG', 'PNG', 'WEBP', 'GIF'):
			raise ValidationError(self.error_messages['invalid_image'], code='invalid_image')
		return upload


class AttachmentImageForm(forms.ModelForm):
	"""Share the image boundary between direct Admin edits and collection uploads."""
	file = RasterImageField(label=_("Image"))

	class Meta:
		model = Attachment
		fields = '__all__'


class AttachmentUploadForm(AttachmentImageForm):
	def __init__(self, *args, **kwargs):
		self.library = kwargs.pop('library')
		super().__init__(*args, **kwargs)

	class Meta:
		model = Attachment
		fields = ('file',)

	def save(self, commit=True):
		obj = super().save(commit=False)
		obj.library = self.library
		if commit:
			obj.save()
		return obj


class ImageUploadForm(AttachmentUploadForm):
	"""Preserve the gallery form interface while sharing raster validation."""


class AttachmentUpdateForm(forms.ModelForm):
	class Meta:
		model = Attachment
		fields = ()

	def save(self, commit=True):
		obj = super().save(commit=False)
		old_rank = obj.rank
		obj.rank = self.cleaned_data['ORDER'] - 1
		if commit:
			if old_rank != obj.rank:
				Attachment.objects.filter(pk=obj.pk).update(rank=obj.rank)
		return obj


AttachmentUpdateFormSet = modelformset_factory(
	Attachment,
	AttachmentUpdateForm,
	can_order=True,
	can_delete=True,
	extra=0
)
