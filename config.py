# config.py
import os


class Settings:
    # JWT 配置
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-2026")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时

    # 数据库配置
    DATABASE_URL = os.getenv("DATABASE_URL",
                             "mysql+pymysql://root:password@localhost:3306/rental_system?charset=utf8mb4")


settings = Settings()
