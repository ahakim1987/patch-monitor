"""Application configuration settings."""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    database_url: str = "postgresql://patchmonitor:password@localhost:5432/patchmonitor"
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:3000"
    
    # Agent
    agent_secret_key: str = "your-agent-secret-key-here"
    collection_interval_minutes: int = 60
    
    # Redis
    redis_url: Optional[str] = "redis://localhost:6379/0"
    
    # Email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    
    # Slack
    slack_webhook_url: Optional[str] = None
    
    # CVE
    cve_update_interval_hours: int = 24
    nvd_api_key: Optional[str] = None
    
    # Security
    cors_origins: List[str] = [
        "http://localhost:3000", 
        "http://localhost:8000",
        "http://10.0.0.56:3001",
        "http://docker.ntowl.io:3001"
    ]
    rate_limit_per_minute: int = 100
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
