from urllib.parse import urlparse

def normalize_media_urls(result, proxy_base_url):
    proxy_origin = urlparse(proxy_base_url)
    if not proxy_origin.scheme or not proxy_origin.netloc:
        return result

    def normalize(value):
        if isinstance(value, dict):
            return {key: normalize(item) for key, item in value.items()}
        if isinstance(value, list):
            return [normalize(item) for item in value]
        if isinstance(value, str):
            parsed = urlparse(value)
            if parsed.hostname in {"127.0.0.1", "localhost"} and parsed.port == 8000:
                return parsed._replace(scheme=proxy_origin.scheme, netloc=proxy_origin.netloc).geturl()
        return value

    return normalize(result)


