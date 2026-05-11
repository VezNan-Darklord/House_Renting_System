from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from models import ContractModel
from models.database import get_db
from models.schemas import (
    RepairRequest,
    RepairRecord,
    UpdateRepairStatusRequest
)
from models.user_model import UserModel
from models.house_model import HouseModel
from models.repair_model import RepairModel
from utils.auth import get_current_user, get_current_tenant, get_current_landlord
from datetime import datetime

router = APIRouter(prefix="/api/repairs", tags=["维修"])


@router.post("", summary="提交维修申请", status_code=status.HTTP_201_CREATED)
def create_repair(
        request: RepairRequest,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """
    租客提交维修工单

    - 验证房源是否存在
    - 验证租客是否有权报修该房源
    """
    house_id = request.house_id

    # 查询房源
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在")

    # 简单权限检查：只要是租客就可以报修（实际业务中可检查是否有有效合同）
    active_contract = db.query(ContractModel).filter(
        ContractModel.house_id == house_id,
        ContractModel.tenant_id == current_user.id,
        ContractModel.status == 'active'
    ).first()

    if not active_contract:
        raise HTTPException(status_code=403, detail="无权报修该房源")

    # 创建维修工单
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

    return {
        "code": 200,
        "message": "维修申请已提交",
        "data": {"repair_id": new_repair.id}
    }


@router.get("/my", summary="我的维修记录")
def get_my_repairs(
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    获取维修记录列表

    - 租客：查看自己提交的
    - 房东：查看自己名下房源的
    """
    if current_user.role == 'tenant':
        repairs = db.query(RepairModel).filter(
            RepairModel.tenant_id == current_user.id
        ).order_by(RepairModel.created_at.desc()).all()

    elif current_user.role == 'landlord':
        # 关联查询：查找该房东名下房源的所有维修单
        repairs = db.query(RepairModel).join(
            HouseModel, RepairModel.house_id == HouseModel.id
        ).filter(
            HouseModel.landlord_id == current_user.id
        ).order_by(RepairModel.created_at.desc()).all()

    else:
        raise HTTPException(status_code=403, detail="管理员请使用管理接口")

    result = []
    for repair in repairs:
        house = db.query(HouseModel).filter(HouseModel.id == repair.house_id).first()
        tenant = db.query(UserModel).filter(UserModel.id == repair.tenant_id).first()

        result.append(RepairRecord(
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

    return result


@router.put("/{repair_id}/status", summary="更新维修状态")
def update_repair_status(
        repair_id: int,
        request: UpdateRepairStatusRequest,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """
    房东更新维修工单状态

    - pending -> processing -> completed
    """
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

    return {"code": 200, "message": "状态更新成功"}


def get_urgency_label(urgency: str) -> str:
    labels = {'normal': '普通', 'urgent': '紧急'}
    return labels.get(urgency, urgency)


def get_status_label(status: str) -> str:
    labels = {'pending': '待处理', 'processing': '处理中', 'completed': '已完成'}
    return labels.get(status, status)
