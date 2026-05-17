import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me")
DEBUG = os.getenv("DEBUG", "False").strip().lower() == "true"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.accounts",
    "apps.users",
    "apps.projects",
    "apps.bids",
    "apps.blockchain",
    "apps.notifications",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv(
            "DATABASE_URL",
            (
                f"postgresql://{os.getenv('DB_USER', 'postgres')}"
                f":{os.getenv('DB_PASSWORD', '')}"
                f"@{os.getenv('DB_HOST', 'localhost')}"
                f":{os.getenv('DB_PORT', '5432')}"
                f"/{os.getenv('DB_NAME', 'postgres')}"
            ),
        ),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "config.throttling.GeneralUserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "login": "5/15min",      # 5 attempts per 15 minutes for login
        "signup": "10/hour",      # 10 signup attempts per hour per IP
        "anon": "100/hour",       # 100 requests per hour for anonymous users
        "user": "1000/hour",      # 1000 requests per hour for authenticated users
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

DEFAULT_CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
]

ENV_CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CORS_ALLOWED_ORIGINS = list(dict.fromkeys(DEFAULT_CORS_ALLOWED_ORIGINS + ENV_CORS_ALLOWED_ORIGINS))
CORS_ALLOW_CREDENTIALS = True

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Manila"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ============================================================================
# SECURITY & ENVIRONMENT CONFIGURATION
# ============================================================================

# Supabase Integration - Service Role Key (keep confidential)
# Only used server-side for admin operations, never expose to frontend
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Security Headers (configure in production)
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False").strip().lower() == "true"
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS > 0

# Cookie Security (set to True in production with HTTPS)
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False").strip().lower() == "true"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "False").strip().lower() == "true"
CSRF_COOKIE_HTTPONLY = True

# Logging Configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("LOG_LEVEL", "INFO"),
    },
}
