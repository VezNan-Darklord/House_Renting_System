from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from models.database import get_db
from models.schemas import RentRecord as RentRecordSchema, ConfirmPaymentRequest, RemindPaymentRequest, PaginatedResponse, ApiResponse
from models.user_model import UserModel
from models.rent_model import RentRecordModel
from models.contract_model import ContractModel
from utils.auth import get_current_user, get_current_tenant, get_current_landlord
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["租金"])


@router.get("/rent/records", summary="获取租金记录列表")
def get_rent_records(
        contract_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 10,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取租金记录列表"""
    offset = (page - 1) * page_size

    query = db.query(RentRecordModel).join(
        ContractModel, RentRecordModel.contract_id == ContractModel.id
    )

    if current_user.role == 'tenant':
        query = query.filter(ContractModel.tenant_id == current_user.id)
    elif current_user.role == 'landlord':
        query = query.filter(ContractModel.landlord_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="管理员无租金功能")

    if contract_id:
        query = query.filter(RentRecordModel.contract_id == contract_id)

    total = query.count()
    rents = query.order_by(RentRecordModel.month.desc()).offset(offset).limit(page_size).all()

    items = []
    for rent in rents:
        items.append(RentRecordSchema(
            id=rent.id,
            contract_id=rent.contract_id,
            month=rent.month,
            amount=rent.amount,
            status=rent.status,
            status_label="已支付" if rent.status == 'paid' else "未支付",
            paid_at=rent.paid_at
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


@router.post("/rent/confirm-payment", summary="确认付款")
def confirm_payment(
        request: ConfirmPaymentRequest,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """租客确认已线下支付租金"""
    rent = db.query(RentRecordModel).join(
        ContractModel, RentRecordModel.contract_id == ContractModel.id
    ).filter(
        RentRecordModel.id == request.rent_id,
        ContractModel.tenant_id == current_user.id
    ).first()

    if not rent:
        raise HTTPException(status_code=404, detail="租金记录不存在或无权操作")

    if rent.status == 'paid':
        raise HTTPException(status_code=400, detail="该笔租金已支付")

    rent.status = 'paid'
    rent.paid_at = datetime.utcnow()
    db.commit()

    rent_data = RentRecordSchema(
        id=rent.id,
        contract_id=rent.contract_id,
        month=rent.month,
        amount=rent.amount,
        status=rent.status,
        status_label="已支付",
        paid_at=rent.paid_at
    )

    return ApiResponse(
        code=200,
        message="支付确认成功",
        data=rent_data.dict()
    )


@router.post("/rent/remind", summary="提醒付款")
def remind_payment(
        request: RemindPaymentRequest,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """房东发送租金提醒"""
    rent = db.query(RentRecordModel).join(
        ContractModel, RentRecordModel.contract_id == ContractModel.id
    ).filter(
        RentRecordModel.id == request.rent_id,
        ContractModel.landlord_id == current_user.id
    ).first()

    if not rent:
        raise HTTPException(status_code=404, detail="租金记录不存在或无权操作")

    if rent.status == 'paid':
        raise HTTPException(status_code=400, detail="该笔租金已支付，无需提醒")

    return ApiResponse(
        code=200,
        message="提醒成功",
        data=None
    )
