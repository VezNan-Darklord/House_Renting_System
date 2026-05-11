from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models.database import get_db
from models.user_model import UserModel
from models.log_model import LogModel
from models.complaint_model import ComplaintModel
from models.schemas import (
    User as UserSchema,
    LogRecord,
    ComplaintRecord,
    ResetPasswordRequest,
    HandleComplaintRequest
)
from utils.auth import get_current_admin, get_password_hash
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["后台管理"])


# ==================== 用户管理 ====================

@router.get("/users", summary="获取用户列表")
def get_users(
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        role: Optional[str] = Query(None, description="筛选角色：landlord/tenant/admin"),
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员查看所有注册用户"""
    query = db.query(UserModel)

    if role:
        query = query.filter(UserModel.role == role)

    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            UserSchema(
                id=u.id, role=u.role, email=u.email, nickname=u.nickname,
                phone=u.phone, avatar=u.avatar, is_active=u.is_active, created_at=u.created_at
            ) for u in users
        ]
    }


@router.put("/users/{user_id}/toggle", summary="禁用/启用用户")
def toggle_user_status(
        user_id: int,
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """切换账号的激活状态（封号/解封）"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能禁用自己")

    user.is_active = not user.is_active
    db.commit()

    action = "禁用" if not user.is_active else "启用"
    log_action(db, current_user.id, f"{action}用户: {user.nickname}")

    return {"code": 200, "message": f"已{action}该用户"}


@router.put("/users/{user_id}/reset-password", summary="重置用户密码")
def reset_user_password(
        user_id: int,
        request: ResetPasswordRequest,
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员强制重置用户密码"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.password_hash = get_password_hash(request.new_password)
    db.commit()

    log_action(db, current_user.id, f"重置用户 {user.nickname} 的密码")

    return {"code": 200, "message": "密码重置成功"}


# ==================== 投诉管理 ====================

@router.get("/complaints", summary="查看所有投诉")
def get_all_complaints(
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员处理所有租客的投诉"""
    complaints = db.query(ComplaintModel).order_by(
        ComplaintModel.status.asc(), ComplaintModel.created_at.desc()
    ).all()

    result = []
    for c in complaints:
        tenant = db.query(UserModel).filter(UserModel.id == c.tenant_id).first()
        result.append(ComplaintRecord(
            id=c.id, tenant_id=c.tenant_id, tenant_nickname=tenant.nickname if tenant else "",
            type=c.type, type_label=get_type_label(c.type), content=c.content,
            status=c.status, status_label="待处理" if c.status == 'pending' else "已处理",
            admin_feedback=c.admin_feedback or "", created_at=c.created_at, updated_at=c.updated_at
        ))
    return result


@router.put("/complaints/{complaint_id}/handle", summary="处理投诉")
def handle_complaint(
        complaint_id: int,
        request: HandleComplaintRequest,
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员填写反馈并结案"""
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="投诉不存在")

    complaint.status = 'resolved'
    complaint.admin_feedback = request.feedback
    complaint.updated_at = datetime.utcnow()
    db.commit()

    log_action(db, current_user.id, f"处理投诉 ID: {complaint_id}")

    return {"code": 200, "message": "投诉处理完成"}


# ==================== 系统日志 ====================

@router.get("/logs", summary="查看系统操作日志")
def get_system_logs(
        page: int = Query(1, ge=1),
        page_size: int = Query(50, ge=1, le=200),
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """查看全平台的操作记录"""
    total = db.query(LogModel).count()
    logs = db.query(LogModel).order_by(LogModel.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            LogRecord(
                id=l.id, user_id=l.user_id,
                user_nickname=db.query(UserModel).filter(
                    UserModel.id == l.user_id).first().nickname if l.user_id else "系统",
                action=l.action, ip_address=l.ip_address, created_at=l.created_at
            ) for l in logs
        ]
    }


# ==================== 辅助函数 ====================

def log_action(db: Session, user_id: int, action: str):
    """记录管理员操作日志"""
    log = LogModel(
        user_id=user_id,
        action=action,
        ip_address="127.0.0.1",  # 实际项目中应从 request 获取
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()


def get_type_label(type_val: str) -> str:
    labels = {'house': '房源问题', 'landlord': '房东问题', 'other': '其他问题'}
    return labels.get(type_val, type_val)
