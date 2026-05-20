from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from models.database import get_db
from models.schemas import (
    RepairRequest,
    RepairRecord,
    UpdateRepairStatusRequest,
    PaginatedResponse,
    ApiResponse
)
from models.user_model import UserModel
from models.house_model import HouseModel
from models.repair_model import RepairModel
from models.contract_model import ContractModel
from utils.auth import get_current_user, get_current_tenant, get_current_landlord
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["维修"])


@router.post("/repair", summary="提交维修申请", status_code=status.HTTP_201_CREATED)
def create_repair(
        request: RepairRequest,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """租客提交维修工单"""
    house_id = request.house_id

    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在")

    active_contract = db.query(ContractModel).filter(
        ContractModel.house_id == house_id,
        ContractModel.tenant_id == current_user.id,
        ContractModel.status == 'active'
    ).first()

    if not active_contract:
        raise HTTPException(status_code=403, detail="无权报修该房源")

    new_repair = RepairModel(
        house_id=house_id,
        tenant_id=current_user.id,
        description=request.description,
        urgency=request.urgency.value,
        status='pending',
        created_at=datetime.utcnow()
    )

    db.add(new_repair)
    db.commit()
    db.refresh(new_repair)

    tenant = db.query(UserModel).filter(UserModel.id == new_repair.tenant_id).first()

    repair_data = RepairRecord(
        id=new_repair.id,
        house_id=new_repair.house_id,
        house_address=f"{house.address_province}{house.address_city}{house.address_district}{house.address_detail}",
        tenant_id=new_repair.tenant_id,
        tenant_nickname=tenant.nickname if tenant else "",
        description=new_repair.description,
        urgency=new_repair.urgency,
        urgency_label=get_urgency_label(new_repair.urgency),
        status=new_repair.status,
        status_label=get_status_label(new_repair.status),
        created_at=new_repair.created_at,
        updated_at=new_repair.updated_at
    )

    return ApiResponse(
        code=200,
        message="维修申请已提交",
        data=repair_data.dict()
    )


@router.get("/repair/list", summary="获取维修工单列表")
def get_repair_list(
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取维修记录列表"""
    offset = (page - 1) * page_size

    if current_user.role == 'tenant':
        query = db.query(RepairModel).filter(RepairModel.tenant_id == current_user.id)
    elif current_user.role == 'landlord':
        query = db.query(RepairModel).join(
            HouseModel, RepairModel.house_id == HouseModel.id
        ).filter(HouseModel.landlord_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="管理员请使用管理接口")

    if status:
        query = query.filter(RepairModel.status == status)

    total = query.count()
    repairs = query.order_by(RepairModel.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for repair in repairs:
        house = db.query(HouseModel).filter(HouseModel.id == repair.house_id).first()
        tenant = db.query(UserModel).filter(UserModel.id == repair.tenant_id).first()

        items.append(RepairRecord(
            id=repair.id,
            house_id=repair.house_id,
            house_address=f"{house.address_province}{house.address_city}{house.address_district}{house.address_detail}" if house else "",
            tenant_id=repair.tenant_id,
            tenant_nickname=tenant.nickname if tenant else "",
            description=repair.description,
            urgency=repair.urgency,
            urgency_label=get_urgency_label(repair.urgency),
            status=repair.status,
            status_label=get_status_label(repair.status),
            created_at=repair.created_at,
            updated_at=repair.updated_at
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


@router.get("/repair/{repair_id}", summary="获取维修工单详情")
def get_repair_detail(
        repair_id: int,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取维修工单详细信息"""
    repair = db.query(RepairModel).filter(RepairModel.id == repair_id).first()

    if not repair:
        raise HTTPException(status_code=404, detail="工单不存在")

    if current_user.role == 'tenant' and repair.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看此工单")

    if current_user.role == 'landlord':
        house = db.query(HouseModel).filter(HouseModel.id == repair.house_id).first()
        if house and house.landlord_id != current_user.id:
            raise HTTPException(status_code=403, detail="无权查看此工单")

    house = db.query(HouseModel).filter(HouseModel.id == repair.house_id).first()
    tenant = db.query(UserModel).filter(UserModel.id == repair.tenant_id).first()

    repair_data = RepairRecord(
        id=repair.id,
        house_id=repair.house_id,
        house_address=f"{house.address_province}{house.address_city}{house.address_district}{house.address_detail}" if house else "",
        tenant_id=repair.tenant_id,
        tenant_nickname=tenant.nickname if tenant else "",
        description=repair.description,
        urgency=repair.urgency,
        urgency_label=get_urgency_label(repair.urgency),
        status=repair.status,
        status_label=get_status_label(repair.status),
        created_at=repair.created_at,
        updated_at=repair.updated_at
    )

    return ApiResponse(
        code=200,
        message="成功",
        data=repair_data.dict()
    )


@router.patch("/repair/{repair_id}/status", summary="更新维修状态")
def update_repair_status(
        repair_id: int,
        request: UpdateRepairStatusRequest,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """房东更新维修工单状态"""
    repair = db.query(RepairModel).join(
        HouseModel, RepairModel.house_id == HouseModel.id
    ).filter(
        RepairModel.id == repair_id,
        HouseModel.landlord_id == current_user.id
    ).first()

    if not repair:
        raise HTTPException(status_code=404, detail="工单不存在或无权操作")

    repair.status = request.status.value
    repair.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(repair)

    house = db.query(HouseModel).filter(HouseModel.id == repair.house_id).first()
    tenant = db.query(UserModel).filter(UserModel.id == repair.tenant_id).first()

    repair_data = RepairRecord(
        id=repair.id,
        house_id=repair.house_id,
        house_address=f"{house.address_province}{house.address_city}{house.address_district}{house.address_detail}" if house else "",
        tenant_id=repair.tenant_id,
        tenant_nickname=tenant.nickname if tenant else "",
        description=repair.description,
        urgency=repair.urgency,
        urgency_label=get_urgency_label(repair.urgency),
        status=repair.status,
        status_label=get_status_label(repair.status),
        created_at=repair.created_at,
        updated_at=repair.updated_at
    )

    return ApiResponse(
        code=200,
        message="状态更新成功",
        data=repair_data.dict()
    )


def get_urgency_label(urgency: str) -> str:
    labels = {'normal': '普通', 'urgent': '紧急'}
    return labels.get(urgency, urgency)


def get_status_label(status: str) -> str:
    labels = {'pending': '待处理', 'processing': '处理中', 'completed': '已完成'}
    return labels.get(status, status)
