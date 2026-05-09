from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import User as UserSchema, UpdateProfileRequest, ChangePasswordRequest, RentalHistory
from models.user_model import UserModel
from utils.auth import get_current_user
from typing import List

router = APIRouter(prefix="/api/users", tags=["用户"])


@router.get("/profile", summary="获取个人信息", response_model=UserSchema)
def get_profile(current_user: UserModel = Depends(get_current_user)):
    """获取当前登录用户的个人信息"""
    return UserSchema(
        id=current_user.id,
        role=current_user.role,
        email=current_user.email,
        nickname=current_user.nickname,
        phone=current_user.phone,
        avatar=current_user.avatar,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )


@router.put("/profile", summary="更新个人信息", response_model=UserSchema)
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

    return UserSchema(
        id=current_user.id,
        role=current_user.role,
        email=current_user.email,
        nickname=current_user.nickname,
        phone=current_user.phone,
        avatar=current_user.avatar,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )


@router.put("/password", summary="修改密码")
def change_password(
        request: ChangePasswordRequest,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """修改当前用户密码"""
    from utils.auth import verify_password, get_password_hash

    # 验证旧密码
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="旧密码错误")

    # 更新新密码
    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()

    return {"code": 200, "message": "密码修改成功", "data": None}


@router.get("/rental-history", summary="获取租赁历史", response_model=List[RentalHistory])
def get_rental_history(
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取当前租客的租赁历史记录"""
    from models.contract_model import ContractModel
    from models.house_model import HouseModel

    contracts = db.query(ContractModel).join(
        HouseModel, ContractModel.house_id == HouseModel.id
    ).filter(
        ContractModel.tenant_id == current_user.id
    ).all()

    return [
        RentalHistory(
            contract_id=contract.id,
            house_address=contract.house_address if hasattr(contract, 'house_address') else "",
            house_layout=contract.house_layout if hasattr(contract, 'house_layout') else "",
            start_date=str(contract.start_date),
            end_date=str(contract.end_date),
            monthly_rent=contract.monthly_rent,
            status=contract.status
        )
        for contract in contracts
    ]
