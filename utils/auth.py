from datetime import datetime, timedelta
from jose import jwt, JWTError, ExpiredSignatureError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models.database import get_db
from models.user_model import UserModel
from config import settings

# 使用统一的配置
security = HTTPBearer(auto_error=True)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        password_byte_enc = plain_password.encode('utf-8')
        hashed_byte_enc = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_byte_enc, hashed_byte_enc)
    except Exception as e:
        print(f"[ERROR] 密码验证失败: {e}")
        return False


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)  # 增加安全性
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """创建访问令牌"""
    to_encode = data.copy()

    # 设置过期时间
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})

    # 使用统一的 SECRET_KEY 和算法
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """解码访问令牌"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        print(f"[ERROR] Token 解码失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
) -> UserModel:
    """获取当前用户（用于需要登录的接口）"""
    token = credentials.credentials

    # 解码 Token
    payload = decode_access_token(token)

    # 提取用户ID
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 中缺少用户ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 查询用户
    user = db.query(UserModel).filter(UserModel.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 检查账号状态
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用"
        )

    return user


def get_current_landlord(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """仅允许房东访问"""
    if current_user.role != 'landlord':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，仅房东可访问"
        )
    return current_user


def get_current_tenant(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """仅允许租客访问"""
    if current_user.role != 'tenant':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，仅租客可访问"
        )
    return current_user


def get_current_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """仅允许管理员访问"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，仅管理员可访问"
        )
    return current_user
