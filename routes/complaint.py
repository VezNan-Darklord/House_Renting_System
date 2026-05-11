from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models.database import get_db
from models.schemas import (
    ComplaintRequest,
    ComplaintRecord,
    HandleComplaintRequest
)
from models.user_model import UserModel
from models.complaint_model import ComplaintModel
from utils.auth import get_current_user, get_current_tenant, get_current_admin
from datetime import datetime

router = APIRouter(prefix="/api/complaints", tags=["投诉"])


@router.post("", summary="提交投诉", status_code=status.HTTP_201_CREATED)
def create_complaint(
        request: ComplaintRequest,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """租客提交投诉"""
    new_complaint = ComplaintModel(
        tenant_id=current_user.id,
        type=request.type.value,
        content=request.content,
        status='pending',
        admin_feedback="",
        created_at=datetime.utcnow()
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return {
        "code": 200,
        "message": "投诉已提交，等待管理员处理",
        "data": {"complaint_id": new_complaint.id}
    }


@router.get("/my", summary="我的投诉记录")
def get_my_complaints(
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """租客查看自己提交的投诉"""
    complaints = db.query(ComplaintModel).filter(
        ComplaintModel.tenant_id == current_user.id
    ).order_by(ComplaintModel.created_at.desc()).all()

    result = []
    for complaint in complaints:
        tenant = db.query(UserModel).filter(UserModel.id == complaint.tenant_id).first()

        result.append(ComplaintRecord(
            id=complaint.id,
            tenant_id=complaint.tenant_id,
            tenant_nickname=tenant.nickname if tenant else "",
            type=complaint.type,
            type_label=get_type_label(complaint.type),
            content=complaint.content,
            status=complaint.status,
            status_label="待处理" if complaint.status == 'pending' else "已处理",
            admin_feedback=complaint.admin_feedback or "",
            created_at=complaint.created_at,
            updated_at=complaint.updated_at
        ))

    return result


@router.get("", summary="所有投诉列表（管理员）")
def get_all_complaints(
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员查看所有投诉"""
    complaints = db.query(ComplaintModel).order_by(
        ComplaintModel.status.asc(),  # 待处理的排前面
        ComplaintModel.created_at.desc()
    ).all()

    result = []
    for complaint in complaints:
        tenant = db.query(UserModel).filter(UserModel.id == complaint.tenant_id).first()

        result.append(ComplaintRecord(
            id=complaint.id,
            tenant_id=complaint.tenant_id,
            tenant_nickname=tenant.nickname if tenant else "",
            type=complaint.type,
            type_label=get_type_label(complaint.type),
            content=complaint.content,
            status=complaint.status,
            status_label="待处理" if complaint.status == 'pending' else "已处理",
            admin_feedback=complaint.admin_feedback or "",
            created_at=complaint.created_at,
            updated_at=complaint.updated_at
        ))

    return result


@router.put("/{complaint_id}/handle", summary="处理投诉（管理员）")
def handle_complaint(
        complaint_id: int,
        request: HandleComplaintRequest,
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员处理投诉并填写反馈"""
    complaint = db.query(ComplaintModel).filter(
        ComplaintModel.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="投诉不存在")

    complaint.status = 'resolved'
    complaint.admin_feedback = request.feedback
    complaint.updated_at = datetime.utcnow()
    db.commit()

    return {"code": 200, "message": "投诉处理完成"}


def get_type_label(type_val: str) -> str:
    labels = {
        'house': '房源问题',
        'landlord': '房东问题',
        'other': '其他问题'
    }
    return labels.get(type_val, type_val)
