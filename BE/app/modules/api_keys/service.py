from app.core.security import new_api_key
from app.modules.api_keys.models import ApiKey


def build_api_key(name, owner_id):
    raw, prefix, hashed = new_api_key()
    return ApiKey(name=name, prefix=prefix, key_hash=hashed, owner_id=owner_id), raw

