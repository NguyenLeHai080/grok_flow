import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
import jwt
from jwt import InvalidTokenError
from passlib.context import CryptContext
from app.core.config import settings

argon2 = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
legacy_passwords = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password):
    return argon2.hash(password)


def verify_password(password, hashed):
    try:
        if hashed.startswith("$argon2"):
            return argon2.verify(hashed, password)
        return legacy_passwords.verify(password, hashed)
    except (VerifyMismatchError, InvalidHashError, ValueError):
        return False


def password_needs_rehash(hashed):
    return not hashed.startswith("$argon2") or argon2.check_needs_rehash(hashed)


def create_token(subject, token_type, lifetime):
    now, token_id = datetime.now(UTC), secrets.token_urlsafe(24)
    expires = now + lifetime
    token = jwt.encode({"sub": str(subject), "type": token_type, "jti": token_id, "iat": now, "nbf": now, "exp": expires, "iss": "groks-api", "aud": "groks-console"}, settings.secret_key, algorithm="HS256")
    return token, token_id, expires


def decode_token(token, expected_type):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"], audience="groks-console", issuer="groks-api")
    except InvalidTokenError as error:
        raise ValueError("Token không hợp lệ hoặc đã hết hạn") from error
    if payload.get("type") != expected_type or not payload.get("sub") or not payload.get("jti"):
        raise ValueError("Sai loại token")
    return payload


def fingerprint(value):
    return hashlib.sha256(value.encode()).hexdigest()


def new_api_key():
    raw = f"uxpm_live_{secrets.token_urlsafe(32)}"
    return raw, raw[:14], fingerprint(raw)
