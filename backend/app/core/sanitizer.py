import re
import html
from typing import Any

# Regex to detect potentially malicious HTML script tags, event handlers, or javascript: URIs
DANGEROUS_PATTERNS = [
    re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<\s*script[^>]*>", re.IGNORECASE),
    re.compile(r"javascript\s*:", re.IGNORECASE),
    re.compile(r"on\w+\s*=", re.IGNORECASE),
    re.compile(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<\s*iframe[^>]*>", re.IGNORECASE),
]

def sanitize_text(text: str) -> str:
    """
    Sanitize user-provided text inputs by stripping executable HTML scripts, dangerous
    handlers, javascript URIs, and unsafe HTML tags.
    Maintains legitimate punctuation (apostrophes, hyphens, ampersands), Kannada, and English characters.
    """
    if not text or not isinstance(text, str):
        return text

    sanitized = text
    for pattern in DANGEROUS_PATTERNS:
        sanitized = pattern.sub("", sanitized)

    # Strip any residual HTML/XML tags completely
    sanitized = re.sub(r"<[^>]*>", "", sanitized)
    
    # Normalize multiple whitespace
    sanitized = re.sub(r"[ \t]+", " ", sanitized)
    return sanitized.strip()

def sanitize_dict(data: dict) -> dict:
    """Recursively sanitize string values in a dictionary."""
    clean = {}
    for k, v in data.items():
        if isinstance(v, str):
            clean[k] = sanitize_text(v)
        elif isinstance(v, dict):
            clean[k] = sanitize_dict(v)
        elif isinstance(v, list):
            clean[k] = [sanitize_text(i) if isinstance(i, str) else i for i in v]
        else:
            clean[k] = v
    return clean
