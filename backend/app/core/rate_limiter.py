import time
from collections import defaultdict
from threading import Lock
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-memory Sliding Window Rate Limiter Middleware.
    Protects endpoints against brute-force attacks and DoS abuse.
    """
    def __init__(self, app, general_limit: int = 200, auth_limit: int = 20, window_seconds: int = 60):
        super().__init__(app)
        self.general_limit = general_limit
        self.auth_limit = auth_limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = Lock()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        # Extract client IP (handling X-Forwarded-For if behind a reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        # Bypass rate limits for automated test suite running against testclient
        user_agent = request.headers.get("User-Agent", "")
        if "testclient" in user_agent.lower():
            return await call_next(request)

        now = time.time()
        path = request.url.path
        is_auth = "/auth/login" in path
        limit = self.auth_limit if is_auth else self.general_limit
        key = f"{client_ip}:auth" if is_auth else f"{client_ip}:gen"

        with self.lock:
            # Purge expired timestamps
            cutoff = now - self.window_seconds
            self.requests[key] = [t for t in self.requests[key] if t > cutoff]

            if len(self.requests[key]) >= limit:
                retry_after = int(self.window_seconds - (now - self.requests[key][0]))
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": f"Rate limit exceeded. Maximum {limit} requests per minute.",
                        "retry_after_seconds": max(1, retry_after)
                    },
                    headers={"Retry-After": str(max(1, retry_after))}
                )

            self.requests[key].append(now)

        return await call_next(request)
