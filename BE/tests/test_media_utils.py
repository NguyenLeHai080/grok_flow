from app.core.config import settings
from app.modules.jobs.media_utils import normalize_media_urls, public_media_url


def test_public_media_url_rewrites_managed_grok2api_url():
    original = settings.public_origin
    settings.public_origin = "https://testflowgrok.nexoratech.com.vn"
    try:
        value = public_media_url("http://grok2api:8000/v1/media/images/example", "http://grok2api:8000")
        assert value == "https://testflowgrok.nexoratech.com.vn/grok2api-runtime/v1/media/images/example"
    finally:
        settings.public_origin = original


def test_normalize_media_urls_rewrites_nested_results():
    original = settings.public_origin
    settings.public_origin = "https://testflowgrok.nexoratech.com.vn"
    try:
        result = normalize_media_urls({"data": [{"url": "http://127.0.0.1:8000/v1/media/images/example"}]}, "http://grok2api:8000")
        assert result["data"][0]["url"].startswith("https://testflowgrok.nexoratech.com.vn/")
    finally:
        settings.public_origin = original


def test_public_media_url_rewrites_video_content_url():
    original = settings.public_origin
    settings.public_origin = "https://testflowgrok.nexoratech.com.vn"
    try:
        value = public_media_url("http://127.0.0.1:8000/v1/videos/video_123/content", "http://grok2api:8000")
        assert value == "https://testflowgrok.nexoratech.com.vn/api/v1/media/videos/video_123/content"
    finally:
        settings.public_origin = original
