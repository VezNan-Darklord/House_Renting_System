from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from models.database import get_db
from models.user_model import UserModel
from models.log_model import LogModel
from models.schemas import (
    User as UserSchema,
    LogRecord,
    AdminResetPasswordRequest,
    PaginatedResponse,
    ApiResponse
)
from utils.auth import get_current_admin, get_password_hash
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["后台管理"])


@router.get("/admin/users", summary="获取用户列表（管理员）")
def get_users(
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        role: Optional[str] = Query(None),
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员查看所有注册用户"""
    offset = (page - 1) * page_size
    query = db.query(UserModel)

    if role:
        query = query.filter(UserModel.role == role)

    total = query.count()
    users = query.offset(offset).limit(page_size).all()

    items = [
        UserSchema(
            id=u.id,
            role=u.role,
            email=u.email,
            nickname=u.nickname,
            phone=u.phone,
            avatar=u.avatar,
            is_active=u.is_active,
            created_at=u.created_at
        ) for u in users
    ]

    return ApiResponse(
        code=200,
        message="成功",
        data={
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": [item.dict() for item in items]
        }
    )


@router.post("/admin/reset-password", summary="重置用户密码（管理员）")
def reset_password(
        request: AdminResetPasswordRequest,
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员强制重置用户密码"""
    user = db.query(UserModel).filter(UserModel.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.password_hash = get_password_hash(request.new_password)
    db.commit()

    return ApiResponse(
        code=200,
        message="密码重置成功",
        data=None
    )


@router.get("/admin/logs", summary="查询系统日志（管理员）")
def get_logs(
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        start_date: Optional[str] = Query(None),
        end_date: Optional[str] = Query(None),
        user_id: Optional[int] = Query(None),
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """查看全平台的操作记录"""
    offset = (page - 1) * page_size
    query = db.query(LogModel)

    if user_id:
        query = query.filter(LogModel.user_id == user_id)

    if start_date:
        query = query.filter(LogModel.created_at >= start_date)

    if end_date:
        query = query.filter(LogModel.created_at <= end_date)

    total = query.count()
    logs = query.order_by(LogModel.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for log in logs:
        user = db.query(UserModel).filter(UserModel.id == log.user_id).first() if log.user_id else None
        items.append(LogRecord(
            id=log.id,
            user_id=log.user_id,
            user_nickname=user.nickname if user else "系统",
            action=log.action,
            ip_address=log.ip_address,
            created_at=log.created_at
        ))

    return ApiResponse(
        code=200,
        message="成功",
        data={
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": [item.dict() for item in items]
        }
    )
