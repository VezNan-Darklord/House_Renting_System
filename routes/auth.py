from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import RegisterRequest, LoginRequest, User as UserSchema, ApiResponse
from models.user_model import UserModel
from utils.auth import get_password_hash, verify_password, create_access_token
from config import settings
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1", tags=["认证"])


@router.post("/auth/register", summary="用户注册")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """用户注册"""
    existing_user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    new_user = UserModel(
        role=request.role.value,
        email=request.email,
        password_hash=get_password_hash(request.password),
        nickname=request.nickname,
        created_at=datetime.utcnow()
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "user_id": new_user.id,
                "role": new_user.role,
                "email": new_user.email
            },
            expires_delta=access_token_expires
        )

        user_data = UserSchema(
            id=new_user.id,
            role=new_user.role,
            email=new_user.email,
            nickname=new_user.nickname,
            phone=new_user.phone,
            avatar=new_user.avatar,
            is_active=new_user.is_active,
            created_at=new_user.created_at
        )

        return ApiResponse(
            code=200,
            message="注册成功",
            data={
                "token": access_token,
                "user": user_data.dict()
            }
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")


@router.post("/auth/login", summary="用户登录")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """用户登录，返回 JWT Token"""
    user = db.query(UserModel).filter(UserModel.email == request.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "role": user.role,
            "email": user.email
        },
        expires_delta=access_token_expires
    )

    user_data = UserSchema(
        id=user.id,
        role=user.role,
        email=user.email,
        nickname=user.nickname,
        phone=user.phone,
        avatar=user.avatar,
        is_active=user.is_active,
        created_at=user.created_at
    )

    return ApiResponse(
        code=200,
        message="登录成功",
        data={
            "token": access_token,
            "user": user_data.dict()
        }
    )
