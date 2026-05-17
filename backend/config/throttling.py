from rest_framework.throttling import SimpleRateThrottle, AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Rate limit for login attempts: 5 per 15 minutes
    Uses IP address for anonymous users, user ID for authenticated
    """
    scope = "login"
    
    def get_ident(self, request):
        # Use IP for anonymous users, user ID for authenticated
        if request.user and request.user.is_authenticated:
            return str(request.user.id)
        return self.get_ident_ipaddress(request)
    
    def get_ident_ipaddress(self, request):
        # Get client IP, accounting for proxies
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        remote_addr = request.META.get('REMOTE_ADDR')
        num_proxies = getattr(self, 'num_proxies', None)
        
        if num_proxies is not None and num_proxies != 0 and xff:
            addresses = [ip.strip() for ip in xff.split(',')]
            if num_proxies >= 0:
                remote_addr = addresses[-min(num_proxies, len(addresses))]
        elif xff:
            remote_addr = xff.split(',')[0].strip()
        
        return remote_addr


class SignupRateThrottle(SimpleRateThrottle):
    """
    Rate limit for signup: 10 per hour to prevent mass account creation
    """
    scope = "signup"
    
    def get_ident(self, request):
        return self.get_ident_ipaddress(request)
    
    def get_ident_ipaddress(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        remote_addr = request.META.get('REMOTE_ADDR')
        
        if xff:
            remote_addr = xff.split(',')[0].strip()
        
        return remote_addr


class GeneralAnonRateThrottle(AnonRateThrottle):
    """
    General rate limit for anonymous users: 100 per hour
    """
    scope = "anon"


class GeneralUserRateThrottle(UserRateThrottle):
    """
    General rate limit for authenticated users: 1000 per hour
    """
    scope = "user"
