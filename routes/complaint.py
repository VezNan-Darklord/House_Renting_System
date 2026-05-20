from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from models.database import get_db
from models.schemas import (
    ComplaintRequest,
    ComplaintRecord,
    HandleComplaintRequest,
    PaginatedResponse,
    ApiResponse
)
from models.user_model import UserModel
from models.complaint_model import ComplaintModel
from utils.auth import get_current_user, get_current_tenant, get_current_admin
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["投诉"])


@router.post("/complaint", summary="提交投诉", status_code=status.HTTP_201_CREATED)
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

    tenant = db.query(UserModel).filter(UserModel.id == new_complaint.tenant_id).first()

    complaint_data = ComplaintRecord(
        id=new_complaint.id,
        tenant_id=new_complaint.tenant_id,
        tenant_nickname=tenant.nickname if tenant else "",
        type=new_complaint.type,
        type_label=get_type_label(new_complaint.type),
        content=new_complaint.content,
        status=new_complaint.status,
        status_label="待处理" if new_complaint.status == 'pending' else "已处理",
        admin_feedback=new_complaint.admin_feedback or "",
        created_at=new_complaint.created_at,
        updated_at=new_complaint.updated_at
    )

    return ApiResponse(
        code=200,
        message="投诉已提交，等待管理员处理",
        data=complaint_data.dict()
    )


@router.get("/complaint/list", summary="获取投诉列表")
def get_complaint_list(
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取投诉列表"""
    offset = (page - 1) * page_size

    if current_user.role == 'tenant':
        query = db.query(ComplaintModel).filter(ComplaintModel.tenant_id == current_user.id)
    elif current_user.role == 'admin':
        query = db.query(ComplaintModel)
    else:
        raise HTTPException(status_code=403, detail="房东无投诉功能")

    if status:
        query = query.filter(ComplaintModel.status == status)

    total = query.count()
    complaints = query.order_by(
        ComplaintModel.status.asc(),
        ComplaintModel.created_at.desc()
    ).offset(offset).limit(page_size).all()

    items = []
    for complaint in complaints:
        tenant = db.query(UserModel).filter(UserModel.id == complaint.tenant_id).first()

        items.append(ComplaintRecord(
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


@router.post("/complaint/handle", summary="处理投诉（管理员）")
def handle_complaint(
        request: HandleComplaintRequest,
        current_user: UserModel = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """管理员处理投诉并填写反馈"""
    complaint = db.query(ComplaintModel).filter(
        ComplaintModel.id == request.complaint_id
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="投诉不存在")

    complaint.status = 'resolved'
    complaint.admin_feedback = request.feedback
    complaint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)

    tenant = db.query(UserModel).filter(UserModel.id == complaint.tenant_id).first()

    complaint_data = ComplaintRecord(
        id=complaint.id,
        tenant_id=complaint.tenant_id,
        tenant_nickname=tenant.nickname if tenant else "",
        type=complaint.type,
        type_label=get_type_label(complaint.type),
        content=complaint.content,
        status=complaint.status,
        status_label="已处理",
        admin_feedback=complaint.admin_feedback or "",
        created_at=complaint.created_at,
        updated_at=complaint.updated_at
    )

    return ApiResponse(
        code=200,
        message="投诉处理完成",
        data=complaint_data.dict()
    )


def get_type_label(type_val: str) -> str:
    labels = {
        'house': '房源问题',
        'landlord': '房东问题',
        'other': '其他问题'
    }
    return labels.get(type_val, type_val)
