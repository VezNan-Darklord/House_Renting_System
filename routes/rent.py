from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models.database import get_db
from models.schemas import RentRecord as RentRecordSchema
from models.user_model import UserModel
from models.rent_model import RentRecordModel
from models.contract_model import ContractModel
from models.chat_model import MessageModel
from utils.auth import get_current_user, get_current_tenant, get_current_landlord
from datetime import datetime

router = APIRouter(prefix="/api/rents", tags=["租金"])


@router.get("/my", summary="我的租金记录")
def get_my_rents(
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    获取当前用户的租金记录

    - 租客：查看自己的租金记录
    - 房东：查看名下房源的租金记录
    """
    if current_user.role == 'tenant':
        # 租客查看自己的租金记录
        rents = db.query(RentRecordModel).join(
            ContractModel, RentRecordModel.contract_id == ContractModel.id
        ).filter(
            ContractModel.tenant_id == current_user.id
        ).order_by(RentRecordModel.month.desc()).all()

    elif current_user.role == 'landlord':
        # 房东查看自己房源的租金记录
        rents = db.query(RentRecordModel).join(
            ContractModel, RentRecordModel.contract_id == ContractModel.id
        ).filter(
            ContractModel.landlord_id == current_user.id
        ).order_by(RentRecordModel.month.desc()).all()

    else:
        raise HTTPException(status_code=403, detail="管理员无租金功能")

    result = []
    for rent in rents:
        contract = db.query(ContractModel).filter(ContractModel.id == rent.contract_id).first()
        house = None
        if contract:
            from models.house_model import HouseModel
            house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()

        result.append(RentRecordSchema(
            id=rent.id,
            contract_id=rent.contract_id,
            month=rent.month,
            amount=rent.amount,
            status=rent.status,
            status_label="已支付" if rent.status == 'paid' else "未支付",
            paid_at=rent.paid_at
        ))

    return result


@router.put("/{rent_id}/pay", summary="确认已付租金")
def confirm_payment(
        rent_id: int,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """
    租客确认已线下支付租金

    - 更新租金状态为 paid
    - 记录支付时间
    """
    rent = db.query(RentRecordModel).join(
        ContractModel, RentRecordModel.contract_id == ContractModel.id
    ).filter(
        RentRecordModel.id == rent_id,
        ContractModel.tenant_id == current_user.id
    ).first()

    if not rent:
        raise HTTPException(status_code=404, detail="租金记录不存在或无权操作")

    if rent.status == 'paid':
        raise HTTPException(status_code=400, detail="该笔租金已支付")

    rent.status = 'paid'
    rent.paid_at = datetime.utcnow()
    db.commit()

    return {"code": 200, "message": "支付确认成功"}


@router.post("/{rent_id}/remind", summary="房东提醒租客付款")
def remind_payment(
        rent_id: int,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """
    房东发送租金提醒

    - 在聊天室中发送系统消息
    - 通知租客及时付款
    """
    rent = db.query(RentRecordModel).join(
        ContractModel, RentRecordModel.contract_id == ContractModel.id
    ).filter(
        RentRecordModel.id == rent_id,
        ContractModel.landlord_id == current_user.id
    ).first()

    if not rent:
        raise HTTPException(status_code=404, detail="租金记录不存在或无权操作")

    if rent.status == 'paid':
        raise HTTPException(status_code=400, detail="该笔租金已支付，无需提醒")

    # 获取合同信息
    contract = db.query(ContractModel).filter(ContractModel.id == rent.contract_id).first()

    # 获取聊天室
    from models.chat_model import ChatRoomModel
    chat_room = db.query(ChatRoomModel).filter(
        ChatRoomModel.house_id == contract.house_id,
        ChatRoomModel.tenant_id == contract.tenant_id,
        ChatRoomModel.landlord_id == contract.landlord_id
    ).first()

    if chat_room:
        # 发送系统提醒消息
        reminder_message = f"【租金提醒】您好，{rent.month} 的租金 {rent.amount} 元尚未支付，请及时处理。"

        system_message = MessageModel(
            room_id=chat_room.id,
            sender_id=current_user.id,  # 以房东身份发送
            content=reminder_message,
            created_at=datetime.utcnow()
        )

        db.add(system_message)
        db.commit()

        return {"code": 200, "message": "提醒消息已发送"}
    else:
        return {"code": 200, "message": "提醒成功（聊天室不存在，仅更新状态）"}
