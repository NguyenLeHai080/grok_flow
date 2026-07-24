from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    secret_key: str = "development-only-change-me-please"
    environment: str = "development"
    database_url: str = "sqlite:///./groks.db"
    job_execution_mode: str = "inline"
    redis_url: str = "redis://127.0.0.1:6379/0"
    cors_origins: list[str] = ["http://localhost:5173"]
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "testserver"]
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    cliproxyapi_token: str = ""
    cliproxyapi_port: int = 8317
    cliproxyapi_management_key: str = ""
    cliproxyapi_api_key: str = ""
    grok2api_api_key: str = ""
    grok2api_base_url: str = "http://127.0.0.1:8002"
    public_origin: str = "http://localhost:8080"
    grok2api_admin_username: str = "admin"
    grok2api_admin_password: str = ""
    xai_api_key: str = ""
    cookie_secure: bool = False
    force_https: bool = False
    allow_private_proxy_hosts: bool = True
    max_request_bytes: int = 15_728_640
    max_provider_response_bytes: int = 5_242_880

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value):
        return [item.strip() for item in value.split(",")] if isinstance(value, str) else value

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def parse_hosts(cls, value):
        return [item.strip() for item in value.split(",")] if isinstance(value, str) else value

    def validate_security(self):
        if self.job_execution_mode not in {"inline", "queue"}:
            raise RuntimeError("JOB_EXECUTION_MODE must be inline or queue")
        if self.environment.lower() == "production":
            if self.job_execution_mode != "queue":
                raise RuntimeError("Production must use JOB_EXECUTION_MODE=queue")
            if len(self.secret_key) < 32 or self.secret_key == "development-only-change-me-please":
                raise RuntimeError("SECRET_KEY production phải ngẫu nhiên và dài ít nhất 32 ký tự")
            if "*" in self.cors_origins or "*" in self.allowed_hosts:
                raise RuntimeError("Production không được dùng wildcard cho CORS hoặc ALLOWED_HOSTS")
            if not self.cookie_secure or not self.force_https or self.allow_private_proxy_hosts:
                raise RuntimeError("Production phải bật secure cookie/HTTPS và chặn private proxy hosts")


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
