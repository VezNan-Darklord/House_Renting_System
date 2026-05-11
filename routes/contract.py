from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models.database import get_db
from models.schemas import (
    Contract as ContractSchema,
    CreateContractRequest,
    ConfirmContractRequest
)
from models.user_model import UserModel
from models.house_model import HouseModel
from models.contract_model import ContractModel
from models.rent_model import RentRecordModel
from utils.auth import get_current_user, get_current_tenant, get_current_landlord
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/api/contracts", tags=["合同"])


@router.post("", summary="发起租赁申请", status_code=status.HTTP_201_CREATED)
def create_contract(
        request: CreateContractRequest,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """
    租客发起租赁申请，生成待确认合同

    - 检查房源是否存在且可租
    - 检查是否已有进行中的申请
    - 生成标准合同条款
    """
    house_id = request.house_id

    # 查询房源
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在")

    if house.status != 'vacant':
        raise HTTPException(status_code=400, detail=f"房源当前状态为：{house.status}，无法租赁")

    # 检查是否已有待处理的合同
    existing_contract = db.query(ContractModel).filter(
        ContractModel.house_id == house_id,
        ContractModel.tenant_id == current_user.id,
        ContractModel.status.in_(['pending_landlord', 'pending_tenant'])
    ).first()

    if existing_contract:
        raise HTTPException(status_code=400, detail="您已对该房源发起过租赁申请，请等待房东确认")

    # 获取房东信息
    landlord = db.query(UserModel).filter(UserModel.id == house.landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="房东信息不存在")

    # 生成合同条款（标准模板）
    terms = generate_contract_terms(house, current_user, landlord)

    # 创建合同
    new_contract = ContractModel(
        house_id=house_id,
        tenant_id=current_user.id,
        landlord_id=house.landlord_id,
        start_date=date.today(),  # 默认从今天开始，实际可由用户选择
        end_date=date.today() + relativedelta(months=12),  # 默认租期1年
        monthly_rent=house.monthly_rent,
        deposit=house.deposit,
        terms=terms,
        status='pending_landlord',
        created_at=datetime.utcnow()
    )

    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)

    return {
        "code": 200,
        "message": "租赁申请已提交，等待房东确认",
        "data": {"contract_id": new_contract.id}
    }


@router.get("/my", summary="我的合同列表")
def get_my_contracts(
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取当前用户相关的合同列表"""
    if current_user.role == 'tenant':
        contracts = db.query(ContractModel).filter(
            ContractModel.tenant_id == current_user.id
        ).order_by(ContractModel.created_at.desc()).all()
    elif current_user.role == 'landlord':
        contracts = db.query(ContractModel).filter(
            ContractModel.landlord_id == current_user.id
        ).order_by(ContractModel.created_at.desc()).all()
    else:
        raise HTTPException(status_code=403, detail="管理员无合同功能")

    result = []
    for contract in contracts:
        house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
        tenant = db.query(UserModel).filter(UserModel.id == contract.tenant_id).first()
        landlord = db.query(UserModel).filter(UserModel.id == contract.landlord_id).first()

        result.append(ContractSchema(
            id=contract.id,
            house_id=contract.house_id,
            tenant_id=contract.tenant_id,
            landlord_id=contract.landlord_id,
            house_address=f"{house.address_province}{house.address_city}{house.address_district}{house.address_detail}" if house else "",
            house_layout=house.layout if house else "",
            house_area=house.area if house else 0,
            tenant_nickname=tenant.nickname if tenant else "",
            tenant_phone=tenant.phone if tenant else "",
            landlord_nickname=landlord.nickname if landlord else "",
            landlord_phone=landlord.phone if landlord else "",
            start_date=str(contract.start_date),
            end_date=str(contract.end_date),
            monthly_rent=contract.monthly_rent,
            deposit=contract.deposit,
            terms=contract.terms,
            status=contract.status,
            status_label=get_status_label(contract.status),
            created_at=contract.created_at,
            updated_at=contract.updated_at
        ))

    return result


@router.get("/{contract_id}", summary="合同详情")
def get_contract_detail(
        contract_id: int,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取合同详细信息"""
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    # 权限检查：只有合同相关方可以查看
    if current_user.id not in [contract.tenant_id, contract.landlord_id]:
        raise HTTPException(status_code=403, detail="无权查看此合同")

    house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
    tenant = db.query(UserModel).filter(UserModel.id == contract.tenant_id).first()
    landlord = db.query(UserModel).filter(UserModel.id == contract.landlord_id).first()

    return ContractSchema(
        id=contract.id,
        house_id=contract.house_id,
        tenant_id=contract.tenant_id,
        landlord_id=contract.landlord_id,
        house_address=f"{house.address_province}{house.address_city}{house.address_district}{house.address_detail}" if house else "",
        house_layout=house.layout if house else "",
        house_area=house.area if house else 0,
        tenant_nickname=tenant.nickname if tenant else "",
        tenant_phone=tenant.phone if tenant else "",
        landlord_nickname=landlord.nickname if landlord else "",
        landlord_phone=landlord.phone if landlord else "",
        start_date=str(contract.start_date),
        end_date=str(contract.end_date),
        monthly_rent=contract.monthly_rent,
        deposit=contract.deposit,
        terms=contract.terms,
        status=contract.status,
        status_label=get_status_label(contract.status),
        created_at=contract.created_at,
        updated_at=contract.updated_at
    )


@router.put("/{contract_id}/confirm", summary="房东确认合同")
def confirm_contract(
        contract_id: int,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """
    房东确认租赁合同

    - 状态从 pending_landlord 变为 pending_tenant
    - 等待租客签署
    """
    contract = db.query(ContractModel).filter(
        ContractModel.id == contract_id,
        ContractModel.landlord_id == current_user.id
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在或无权操作")

    if contract.status != 'pending_landlord':
        raise HTTPException(status_code=400, detail=f"合同当前状态为：{get_status_label(contract.status)}，无法确认")

    contract.status = 'pending_tenant'
    contract.updated_at = datetime.utcnow()
    db.commit()

    return {"code": 200, "message": "合同已确认，等待租客签署"}


@router.put("/{contract_id}/sign", summary="租客签署合同")
def sign_contract(
        contract_id: int,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """
    租客签署合同

    - 状态从 pending_tenant 变为 active
    - 房源状态变为 rented
    - 自动生成租金记录
    """
    contract = db.query(ContractModel).filter(
        ContractModel.id == contract_id,
        ContractModel.tenant_id == current_user.id
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在或无权操作")

    if contract.status != 'pending_tenant':
        raise HTTPException(status_code=400, detail=f"合同当前状态为：{get_status_label(contract.status)}，无法签署")

    # 开启事务
    try:
        # 1. 更新合同状态
        contract.status = 'active'
        contract.updated_at = datetime.utcnow()

        # 2. 更新房源状态
        house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
        if house:
            house.status = 'rented'
            house.updated_at = datetime.utcnow()

        # 3. 生成租金记录（每月一条）
        generate_rent_records(db, contract)

        db.commit()

        return {"code": 200, "message": "合同签署成功，租赁关系已建立"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"签署失败: {str(e)}")


def generate_contract_terms(house: HouseModel, tenant: UserModel, landlord: UserModel) -> str:
    """生成标准合同条款"""
    terms = f"""
    房屋租赁合同

    出租方（甲方）：{landlord.nickname}
    承租方（乙方）：{tenant.nickname}

    第一条 房屋基本情况
    房屋地址：{house.address_province}{house.address_city}{house.address_district}{house.address_detail}
    户型：{house.layout}
    面积：{house.area}平方米

    第二条 租赁期限
    租期：12个月

    第三条 租金及押金
    月租金：{house.monthly_rent}元
    押金：{house.deposit}元

    第四条 双方权利义务
    1. 甲方应保证房屋符合居住条件
    2. 乙方应按时缴纳租金
    3. 乙方应爱护房屋设施
    4. 未经甲方同意，乙方不得转租

    第五条 违约责任
    任何一方违反本合同约定，应承担违约责任。

    第六条 其他约定
    本合同自双方签字之日起生效。
    """
    return terms.strip()


def generate_rent_records(db: Session, contract: ContractModel):
    """生成租金记录（合同生效后自动调用）"""
    start_date = contract.start_date

    # 生成12个月的租金记录
    for i in range(12):
        rent_month = start_date + relativedelta(months=i)
        month_str = rent_month.strftime("%Y-%m")

        rent_record = RentRecordModel(
            contract_id=contract.id,
            month=month_str,
            amount=contract.monthly_rent,
            status='unpaid',
            paid_at=None
        )
        db.add(rent_record)


def get_status_label(status: str) -> str:
    """获取合同状态中文标签"""
    labels = {
        'pending_landlord': '待房东确认',
        'pending_tenant': '待租客签署',
        'active': '已生效',
        'terminated': '已终止'
    }
    return labels.get(status, status)
