from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .base import TimestampedModel
from .portfolio import Category, Space


class LeadStatus(TimestampedModel):
    name = models.CharField(max_length=120)
    color = models.CharField(max_length=32, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']


class Lead(TimestampedModel):
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=120, blank=True)
    spaces_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(2147483647)],
    )

    project_type = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='leads_project_type')
    space_types = models.ManyToManyField(Space, blank=True, related_name='leads')

    message = models.TextField(blank=True)
    budget_range = models.CharField(max_length=120, blank=True)
    how_found_us = models.CharField(max_length=200, blank=True)
    source = models.CharField(max_length=50, default='form')

    utm_source = models.CharField(max_length=120, blank=True)
    utm_medium = models.CharField(max_length=120, blank=True)
    utm_campaign = models.CharField(max_length=120, blank=True)

    status = models.ForeignKey(LeadStatus, null=True, blank=True, on_delete=models.SET_NULL, related_name='leads')
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
