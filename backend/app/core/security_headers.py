import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Production-grade HTTP Security Headers Middleware.
    Hardens API responses against Clickjacking, MIME sniffing, XSS, and unauthorized framing.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Request correlation ID for auditability and incident tracing
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        response = await call_next(request)
        
        # Inject standard security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Permissions-Policy"] = "camera=(self), geolocation=(self), microphone=()"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["X-Request-ID"] = request_id
        
        return response
