from .base import *

import os

DEBUG = False
ALLOWED_HOSTS = [
	host.strip()
	for host in os.getenv("ALLOWED_HOSTS", "").split(",")
	if host.strip()
]

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
