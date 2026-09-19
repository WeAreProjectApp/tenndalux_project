"""
Django settings for core_project.

Configuration follows company architecture standards with:
- Custom User model with email authentication
- JWT authentication via SimpleJWT
- CORS configuration for Next.js frontend
- REST Framework with pagination
- Environment-based configuration
"""

import os
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config
from huey import RedisHuey

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Environment detection
# ---------------------------------------------------------------------------
DJANGO_ENV = config('DJANGO_ENV', default='development')
IS_PRODUCTION = DJANGO_ENV == 'production'

# ---------------------------------------------------------------------------
# Core Django settings
# ---------------------------------------------------------------------------
SECRET_KEY = config('DJANGO_SECRET_KEY', default='change-me')
DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# Application definition
INSTALLED_APPS = [
    # Django Core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party (required)
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    
    # Image management dependencies (must be before django_attachments)
    'easy_thumbnails',
    'django_cleanup.apps.CleanupConfig',
    
    # Gallery/Attachments subproject
    'django_attachments.apps.AppConfig',
    
    # Project apps
    'core_app',
    # Operations
    'dbbackup',
    'huey.contrib.djhuey',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS must be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core_project.wsgi.application'

# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': config('DJANGO_DB_ENGINE', default='django.db.backends.sqlite3'),
        'NAME': config('DJANGO_DB_NAME', default=str(BASE_DIR / 'db.sqlite3')),
    }
}

# Custom User Model (MUST be set before first migration)
AUTH_USER_MODEL = 'core_app.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8}
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=config('JWT_ACCESS_TOKEN_LIFETIME_DAYS', default=1, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-requested-with',
    'x-currency',
    'accept-language',
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files (User uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
    'dbbackup': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
        'OPTIONS': {
            'location': config('BACKUP_STORAGE_PATH', default='/var/backups/tenndalux_project'),
        },
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email configuration. ``EMAIL_BACKEND`` remains an environment-variable
# fallback so existing deployments keep working; Django itself only receives
# the 6.1 ``MAILERS`` setting.
MAILERS = {
    'default': {
        'BACKEND': config(
            'MAILER_BACKEND',
            default=config(
                'EMAIL_BACKEND',
                default='django.core.mail.backends.console.EmailBackend',
            ),
        ),
    },
}
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@tenndalux.com')

# Where the leads from the website form are delivered. Comma-separated, so the
# client can add or drop recipients without a code change. Empty is a valid
# state and the intended default: the lead is still stored and visible in the
# admin, only the notification is skipped. Nothing else has to be touched to
# turn it on -- set the address in backend/.env and restart the service.
LEADS_NOTIFICATION_EMAILS = [
    address.strip()
    for address in config('LEADS_NOTIFICATION_EMAILS', default='').split(',')
    if address.strip()
]

# Prefix of the notification subject, so the client can filter or label these
# in their inbox.
LEADS_NOTIFICATION_SUBJECT_PREFIX = config('LEADS_NOTIFICATION_SUBJECT_PREFIX', default='[Tenndalux]')

# Thumbnail Configuration (required for django_attachments)
THUMBNAIL_ALIASES = {
    '': {
        'small':  {'size': (50, 50),   'crop': True},
        'medium': {'size': (200, 200), 'crop': True},
        'large':  {'size': (500, 500), 'crop': False},
        'admin':  {'size': (100, 100), 'crop': True},
    },
}

# ---------------------------------------------------------------------------
# Silk profiling (conditional — enabled via ENABLE_SILK env var)
# ---------------------------------------------------------------------------
ENABLE_SILK = config('ENABLE_SILK', default=False, cast=bool)

if ENABLE_SILK:
    from .monitoring_export import should_profile

    INSTALLED_APPS += ['silk']
    MIDDLEWARE.insert(0, 'silk.middleware.SilkyMiddleware')

    SILKY_PYTHON_PROFILER = False
    SILKY_PYTHON_PROFILER_BINARY = False
    SILKY_META = False
    SILKY_ANALYZE_QUERIES = False

    SILKY_AUTHENTICATION = True
    SILKY_AUTHORISATION = True

    def silk_permissions(user):
        return user.is_staff

    SILKY_PERMISSIONS = silk_permissions

    SILKY_MAX_RECORDED_REQUESTS = 1_000
    SILKY_MAX_RECORDED_REQUESTS_CHECK_PERCENT = 10
    MONITORING_SILK_SAMPLE_PERCENT = max(0, min(100, config('MONITORING_SILK_SAMPLE_PERCENT', default=5, cast=int)))
    SILKY_INTERCEPT_FUNC = should_profile
    SILKY_SENSITIVE_KEYS = {'username', 'api', 'token', 'key', 'secret', 'password', 'signature', 'cookie', 'authorization'}

    SILKY_IGNORE_PATHS = ['/admin/', '/static/', '/media/', '/silk/']

    SILKY_MAX_REQUEST_BODY_SIZE = 0
    SILKY_MAX_RESPONSE_BODY_SIZE = 0

    SLOW_QUERY_THRESHOLD_MS = 500
    N_PLUS_ONE_THRESHOLD = 10

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_LEVEL = config('DJANGO_LOG_LEVEL', default='INFO')

(BASE_DIR / 'logs').mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'backup_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'backups.log',
            'maxBytes': 5 * 1024 * 1024,
            'backupCount': 3,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
        },
        'backups': {
            'handlers': ['backup_file', 'console'],
            'level': 'INFO',
        },
    },
}

# ---------------------------------------------------------------------------
# Huey — task queue
# ---------------------------------------------------------------------------
HUEY = RedisHuey(
    name='tenndalux_project',
    url=config('REDIS_URL', default='redis://localhost:6379/4'),
    immediate=not IS_PRODUCTION,
)

# ---------------------------------------------------------------------------
# Backups (django-dbbackup)
# ---------------------------------------------------------------------------
# Storage is configured via STORAGES['dbbackup'] above (new-style API).
DBBACKUP_COMPRESS = True
DBBACKUP_CLEANUP_KEEP = 4
DBBACKUP_CLEANUP_KEEP_MEDIA = 4


# ---------------------------------------------------------------------------
# Environment-specific settings (auto-imported)
# ---------------------------------------------------------------------------
if IS_PRODUCTION:
    from .settings_prod import *  # noqa: F401, F403
else:
    from .settings_dev import *  # noqa: F401, F403
