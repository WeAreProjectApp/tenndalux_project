"""
Django Admin configuration for core_app models.

Provides customized admin interfaces with search, filtering,
and display options for better management experience.

The admin index only lists the modules of the client guide (document 242):
Documentos de garantía, Posts, Projects and Home pages. Every other model stays
registered but hidden from the index (see HiddenFromIndexMixin).
"""
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin, UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.token_blacklist.admin import BlacklistedTokenAdmin, OutstandingTokenAdmin
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from django_attachments.admin import AttachmentAdmin, AttachmentsAdminMixin, LibraryAdmin
from django_attachments.models import Attachment, Library

from .forms import ContentBlocksWidget

from .models import (
    User,
    Category,
    Style,
    Space,
    Project,
    Tag,
    Post,
    Service,
    ProcessStep,
    LeadStatus,
    Lead,
    ContentImage,
    SiteSettings,
    HomePage,
    AboutPage,
    WarrantyDocument,
)


class HiddenFromIndexMixin:
    """
    Hide a model from the admin index, its app page and the sidebar, as the
    client guide asks.

    The model stays registered, so the "+" popups, the image upload APIs and
    its direct URLs keep working. This hides; it does not restrict: access is
    still decided by the account's permissions.
    """

    def has_module_permission(self, request):
        return False


@admin.register(User)
class UserAdmin(HiddenFromIndexMixin, BaseUserAdmin):
    """
    Custom admin for User model with email-based authentication.
    
    Provides comprehensive user management with custom fieldsets
    and display options.
    """
    
    list_display = ('email', 'full_name', 'role', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        (_('Personal Info'), {
            'fields': ('first_name', 'last_name', 'role', 'phone', 'avatar')
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        (_('Important Dates'), {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'is_active', 'is_staff'),
        }),
    )
    
    readonly_fields = ('last_login', 'date_joined')


@admin.register(Category)
class CategoryAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'created_at')
    search_fields = ('name', 'slug')
    ordering = ('order', 'name')


@admin.register(Style)
class StyleAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'created_at')
    search_fields = ('name', 'slug')
    ordering = ('order', 'name')


@admin.register(Space)
class SpaceAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'created_at')
    search_fields = ('name', 'slug')
    ordering = ('order', 'name')



class ProjectAdminForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = '__all__'
        widgets = {'content_blocks': ContentBlocksWidget(kind='portafolio')}


class PostAdminForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = '__all__'
        widgets = {'content_blocks': ContentBlocksWidget(kind='blog')}


@admin.register(Project)
class ProjectAdmin(AttachmentsAdminMixin, admin.ModelAdmin):
    form = ProjectAdminForm
    list_display = ('title', 'slug', 'year', 'featured', 'is_published', 'created_at')
    list_filter = ('featured', 'is_published', 'year')
    search_fields = ('title', 'slug', 'location')
    filter_horizontal = ('categories', 'styles', 'spaces')
    ordering = ('-created_at',)


@admin.register(Tag)
class TagAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'created_at')
    search_fields = ('name', 'slug')
    ordering = ('order', 'name')


@admin.register(Post)
class PostAdmin(AttachmentsAdminMixin, admin.ModelAdmin):
    form = PostAdminForm
    list_display = ('title', 'slug', 'is_published', 'published_at', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('title', 'slug', 'excerpt')
    filter_horizontal = ('tags',)
    ordering = ('-created_at',)


@admin.register(Service)
class ServiceAdmin(HiddenFromIndexMixin, AttachmentsAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'slug', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'slug')
    ordering = ('order', 'title')


@admin.register(ProcessStep)
class ProcessStepAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title',)
    ordering = ('order', 'title')


@admin.register(LeadStatus)
class LeadStatusAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    list_display = ('name', 'color', 'order', 'created_at')
    ordering = ('order', 'name')


@admin.register(Lead)
class LeadAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone', 'city', 'spaces_count', 'source', 'status', 'created_at')
    list_filter = ('source', 'status')
    search_fields = ('full_name', 'email', 'phone', 'city', 'message')
    ordering = ('-created_at',)


@admin.register(SiteSettings)
class SiteSettingsAdmin(HiddenFromIndexMixin, AttachmentsAdminMixin, admin.ModelAdmin):
    list_display = ('company_name', 'phone', 'email', 'city', 'updated_at')


@admin.register(HomePage)
class HomePageAdmin(AttachmentsAdminMixin, admin.ModelAdmin):
    list_display = ('hero_title', 'updated_at')
    filter_horizontal = ('featured_projects',)


@admin.register(WarrantyDocument)
class WarrantyDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_published', 'updated_at')
    list_filter = ('is_published',)
    search_fields = ('title',)


@admin.register(AboutPage)
class AboutPageAdmin(HiddenFromIndexMixin, AttachmentsAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'updated_at')


@admin.register(ContentImage)
class ContentImageAdmin(HiddenFromIndexMixin, admin.ModelAdmin):
    """Fotos de los bloques «galeria». Se suben desde el editor, no desde aquí."""

    list_display = ('public_id', 'alt', 'created_at')
    search_fields = ('public_id', 'alt')
    readonly_fields = ('public_id',)
    ordering = ('-created_at',)


# Admins that Django and the installed apps register themselves; importing their
# admin modules above guarantees they are registered by now. They are
# re-registered hidden, never just unregistered: Library's upload APIs back the
# image widgets of Post, Project and HomePage.
admin.site.unregister((Group, OutstandingToken, BlacklistedToken, Attachment, Library))


@admin.register(Group)
class HiddenGroupAdmin(HiddenFromIndexMixin, GroupAdmin):
    pass


@admin.register(OutstandingToken)
class HiddenOutstandingTokenAdmin(HiddenFromIndexMixin, OutstandingTokenAdmin):
    pass


@admin.register(BlacklistedToken)
class HiddenBlacklistedTokenAdmin(HiddenFromIndexMixin, BlacklistedTokenAdmin):
    pass


@admin.register(Attachment)
class HiddenAttachmentAdmin(HiddenFromIndexMixin, AttachmentAdmin):
    pass


@admin.register(Library)
class HiddenLibraryAdmin(HiddenFromIndexMixin, LibraryAdmin):
    pass
