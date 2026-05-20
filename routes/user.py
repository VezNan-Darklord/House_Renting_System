from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import User as UserSchema, UpdateProfileRequest, ChangePasswordRequest, ApiResponse
from models.user_model import UserModel
from utils.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["用户"])


@router.get("/user/profile", summary="获取个人信息")
def get_profile(current_user: UserModel = Depends(get_current_user)):
    """获取当前登录用户的个人信息"""
    user_data = UserSchema(
        id=current_user.id,
        role=current_user.role,
        email=current_user.email,
        nickname=current_user.nickname,
        phone=current_user.phone,
        avatar=current_user.avatar,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

    return ApiResponse(
        code=200,
        message="成功",
        data=user_data.dict()
    )


@router.put("/user/profile", summary="更新个人信息")
def update_profile(
        request: UpdateProfileRequest,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """更新昵称、手机号、头像"""
    if request.nickname is not None:
        current_user.nickname = request.nickname
    if request.phone is not None:
        current_user.phone = request.phone
    if request.avatar is not None:
        current_user.avatar = request.avatar

    db.commit()
    db.refresh(current_user)

    user_data = UserSchema(
        id=current_user.id,
        role=current_user.role,
        email=current_user.email,
        nickname=current_user.nickname,
        phone=current_user.phone,
        avatar=current_user.avatar,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

    return ApiResponse(
        code=200,
        message="个人信息更新成功",
        data=user_data.dict()
    )


@router.post("/user/change-password", summary="修改密码")
def change_password(
        request: ChangePasswordRequest,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """修改当前用户密码"""
    from utils.auth import verify_password, get_password_hash

    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="旧密码错误")

    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()

    return ApiResponse(
        code=200,
        message="密码修改成功",
        data=None
    )
