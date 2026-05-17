# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the Bidding System to protect sensitive data and prevent abuse.

---

## 🔐 Rate Limiting

### Authentication Endpoints
Strict rate limiting is enforced on all authentication-related endpoints to prevent brute force attacks and abuse.

#### Login Rate Limiting
- **Endpoint**: POST `/auth/login/`
- **Limit**: 5 attempts per 15 minutes
- **Identifier**: IP address (or User ID if authenticated)
- **Class**: `LoginRateThrottle` in `config/throttling.py`

```python
# Example: After 5 failed login attempts within 15 minutes, client must wait
# Response: 429 Too Many Requests
```

#### Signup Rate Limiting
- **Endpoint**: POST `/auth/register/supplier/`
- **Limit**: 10 signup attempts per hour per IP
- **Identifier**: Client IP address
- **Class**: `SignupRateThrottle` in `config/throttling.py`

### General Rate Limiting
- **Authenticated Users**: 1000 requests/hour
- **Anonymous Users**: 100 requests/hour

Configure in `config/settings/base.py`:
```python
"DEFAULT_THROTTLE_RATES": {
    "login": "5/15min",
    "signup": "10/hour",
    "anon": "100/hour",
    "user": "1000/hour",
}
```

---

## 🔑 Secrets Management

### Frontend Environment Variables (`frontend/.env`)
**⚠️ IMPORTANT: These are PUBLIC variables exposed to client code**

Only use VITE_ prefixed variables for non-sensitive, public data:
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_key_here
```

✅ **Safe for Frontend**:
- Supabase Anonymous Key (public)
- API Base URLs
- Public configuration values

❌ **NEVER in Frontend**:
- Database credentials
- Django SECRET_KEY
- Supabase Service Role Key
- Private API keys
- OAuth secrets

### Backend Environment Variables (`backend/.env`)
**⚠️ CRITICAL: Keep this file secret and never commit to Git**

```bash
# Authentication
SECRET_KEY=your-generated-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase - Public Keys (exposed)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_public_anon_key

# Supabase - Private Keys (KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY=your_private_service_role_key

# Security
DEBUG=False
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Network
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Generate Django SECRET_KEY
```bash
# Option 1: In terminal
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Option 2: In Django shell
python manage.py shell
>>> from django.core.management.utils import get_random_secret_key
>>> get_random_secret_key()
```

---

## 📋 Secrets Scan Results

### No Hardcoded Secrets Found ✅

Audit results:
- ✅ No hardcoded API keys
- ✅ No hardcoded database passwords
- ✅ No hardcoded tokens
- ✅ All sensitive data uses environment variables
- ✅ Frontend uses only public variables
- ✅ `.gitignore` properly excludes `.env` files

---

## 🛡️ Security Configuration

### Production Deployment Checklist

Before deploying to production:

```bash
# 1. Set DEBUG to False
DEBUG=False

# 2. Generate strong SECRET_KEY
SECRET_KEY=<use-command-above>

# 3. Enable HTTPS/SSL
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# 4. Secure cookies
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
CSRF_COOKIE_SECURE=True
CSRF_COOKIE_HTTPONLY=True

# 5. Update allowed origins
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# 6. Rotate credentials
# - Generate new SECRET_KEY
# - Rotate all Supabase keys
# - Update database credentials
```

### Headers Configuration

The backend is configured with security headers:
```python
# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Cookies
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
CSRF_COOKIE_SECURE=True
CSRF_COOKIE_HTTPONLY=True

# SSL Redirect
SECURE_SSL_REDIRECT=True
```

---

## 🔍 Monitoring & Logging

### Rate Limit Violations

When rate limits are exceeded:
- Status Code: `429 Too Many Requests`
- Response includes retry-after information
- Events are logged for security analysis

### Audit Logging

Critical actions are logged:
- User authentication attempts
- Permission changes
- Sensitive data access
- Configuration modifications

Access logs in Django:
```bash
# Development
tail -f backend/debug.log

# Production
# Configure in LOGGING settings (base.py)
```

---

## 🚀 Best Practices

### For Developers

1. **Never commit `.env` files**
   ```bash
   # Already in .gitignore, but verify
   git check-ignore backend/.env
   git check-ignore frontend/.env
   ```

2. **Use environment variables for all secrets**
   ```python
   # ✅ Correct
   api_key = os.getenv("API_KEY")
   
   # ❌ Wrong
   api_key = "sk_live_1234567890"
   ```

3. **Frontend environment variables must be public**
   ```javascript
   // ✅ Correct - public data only
   const apiUrl = import.meta.env.VITE_API_URL
   
   // ❌ Wrong - never put secrets
   const secretKey = import.meta.env.VITE_SECRET_KEY
   ```

4. **Rotate secrets regularly**
   - Generate new SECRET_KEY before production
   - Rotate API keys quarterly
   - Update database passwords annually

5. **Review .env.example files**
   - Keep placeholders only
   - Document all variables
   - Include security warnings

### For System Administrators

1. **Environment-Specific Configurations**
   ```bash
   .env              # Local development (not in Git)
   .env.production   # Production config (not in Git)
   .env.example      # Template (in Git)
   ```

2. **Key Rotation Strategy**
   - Automate key rotation where possible
   - Maintain key versioning
   - Update applications before rotating

3. **Access Control**
   - Limit `.env` access to authorized personnel
   - Use secrets management tools (e.g., HashiCorp Vault)
   - Audit access logs regularly

4. **Backup & Recovery**
   - Backup credentials securely
   - Test recovery procedures
   - Document restoration process

---

## 📚 Security References

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

## 🆘 Security Issues

If you discover a security vulnerability, **DO NOT** open a public issue.

Instead, report to: security@yourdomain.com (configure in your organization)

---

## 📝 Changelog

### v1.0.0 (May 14, 2026)
- ✅ Implemented rate limiting (5/15min login, 10/hour signup)
- ✅ Moved all secrets to environment variables
- ✅ Added security headers configuration
- ✅ Enhanced .env.example documentation
- ✅ Verified no hardcoded secrets in codebase
- ✅ Configured cookie security
- ✅ Added HSTS and SSL redirect settings
