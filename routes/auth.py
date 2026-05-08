from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import RegisterRequest, LoginRequest, LoginResponse, User as UserSchema
from models.user_model import UserModel
from utils.auth import get_password_hash, verify_password, create_access_token
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", summary="用户注册")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
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

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"code": 200, "message": "注册成功", "data": None}


@router.post("/login", summary="用户登录", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    access_token = create_access_token(
        data={"user_id": user.id, "role": user.role, "email": user.email}
    )

    return LoginResponse(
        token=access_token,
        user=UserSchema(
            id=user.id,
            role=user.role,
            email=user.email,
            nickname=user.nickname,
            phone=user.phone,
            avatar=user.avatar,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )
