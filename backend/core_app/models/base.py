from django.core.exceptions import ValidationError
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        abstract = True


class SingletonModel(models.Model):
    class Meta:
        abstract = True

    @classmethod
    def single_record_message(cls):
        return f'Solo puede existir un registro de «{cls._meta.verbose_name}». Edite el existente.'

    def clean(self):
        super().clean()
        # save() pins every record to pk=1, so a second one is written over the
        # first, which in the admin ended in a 500 (created_at cannot be NULL):
        # refuse it while it can still be explained.
        if self._state.adding and type(self).objects.exists():
            raise ValidationError(self.single_record_message())

    def save(self, *args, **kwargs):
        self.pk = 1
        return super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
