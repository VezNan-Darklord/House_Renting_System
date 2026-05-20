from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from models.database import get_db
from models.schemas import (
    Contract as ContractSchema,
    CreateContractRequest,
    ConfirmContractRequest,
    PaginatedResponse,
    ApiResponse
)
from models.user_model import UserModel
from models.house_model import HouseModel
from models.contract_model import ContractModel
from models.rent_model import RentRecordModel
from utils.auth import get_current_user, get_current_tenant, get_current_landlord
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/api/v1", tags=["合同"])


@router.post("/contract", summary="发起租赁请求", status_code=status.HTTP_201_CREATED)
def create_contract(
        request: CreateContractRequest,
        current_user: UserModel = Depends(get_current_tenant),
        db: Session = Depends(get_db)
):
    """租客发起租赁申请，生成待确认合同"""
    house_id = request.house_id

    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在")

    if house.status != 'vacant':
        raise HTTPException(status_code=400, detail=f"房源当前状态为：{house.status}，无法租赁")

    existing_contract = db.query(ContractModel).filter(
        ContractModel.house_id == house_id,
        ContractModel.tenant_id == current_user.id,
        ContractModel.status.in_(['pending_landlord', 'pending_tenant'])
    ).first()

    if existing_contract:
        raise HTTPException(status_code=400, detail="您已对该房源发起过租赁申请，请等待房东确认")

    landlord = db.query(UserModel).filter(UserModel.id == house.landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="房东信息不存在")

    terms = generate_contract_terms(house, current_user, landlord)

    new_contract = ContractModel(
        house_id=house_id,
        tenant_id=current_user.id,
        landlord_id=house.landlord_id,
        start_date=date.today(),
        end_date=date.today() + relativedelta(months=12),
        monthly_rent=house.monthly_rent,
        deposit=house.deposit,
        terms=terms,
        status='pending_landlord',
        created_at=datetime.utcnow()
    )

    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)

    house_data = db.query(HouseModel).filter(HouseModel.id == new_contract.house_id).first()
    tenant = db.query(UserModel).filter(UserModel.id == new_contract.tenant_id).first()
    landlord_data = db.query(UserModel).filter(UserModel.id == new_contract.landlord_id).first()

    contract_data = ContractSchema(
        id=new_contract.id,
        house_id=new_contract.house_id,
        tenant_id=new_contract.tenant_id,
        landlord_id=new_contract.landlord_id,
        house_address=f"{house_data.address_province}{house_data.address_city}{house_data.address_district}{house_data.address_detail}" if house_data else "",
        house_layout=house_data.layout if house_data else "",
        house_area=house_data.area if house_data else 0,
        tenant_nickname=tenant.nickname if tenant else "",
        tenant_phone=tenant.phone if tenant else "",
        landlord_nickname=landlord_data.nickname if landlord_data else "",
        landlord_phone=landlord_data.phone if landlord_data else "",
        start_date=str(new_contract.start_date),
        end_date=str(new_contract.end_date),
        monthly_rent=new_contract.monthly_rent,
        deposit=new_contract.deposit,
        terms=new_contract.terms,
        status=new_contract.status,
        status_label=get_status_label(new_contract.status),
        created_at=new_contract.created_at,
        updated_at=new_contract.updated_at
    )

    return ApiResponse(
        code=200,
        message="租赁申请已提交，等待房东确认",
        data=contract_data.dict()
    )


@router.get("/contract/list", summary="获取合同列表")
def get_contracts(
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取当前用户相关的合同列表"""
    offset = (page - 1) * page_size

    if current_user.role == 'tenant':
        query = db.query(ContractModel).filter(ContractModel.tenant_id == current_user.id)
    elif current_user.role == 'landlord':
        query = db.query(ContractModel).filter(ContractModel.landlord_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="管理员无合同功能")

    if status:
        query = query.filter(ContractModel.status == status)

    total = query.count()
    contracts = query.order_by(ContractModel.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for contract in contracts:
        house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
        tenant = db.query(UserModel).filter(UserModel.id == contract.tenant_id).first()
        landlord = db.query(UserModel).filter(UserModel.id == contract.landlord_id).first()

        items.append(ContractSchema(
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


@router.get("/contract/{contract_id}", summary="获取合同详情")
def get_contract_detail(
        contract_id: int,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取合同详细信息"""
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    if current_user.id not in [contract.tenant_id, contract.landlord_id]:
        raise HTTPException(status_code=403, detail="无权查看此合同")

    house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
    tenant = db.query(UserModel).filter(UserModel.id == contract.tenant_id).first()
    landlord = db.query(UserModel).filter(UserModel.id == contract.landlord_id).first()

    contract_data = ContractSchema(
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

    return ApiResponse(
        code=200,
        message="成功",
        data=contract_data.dict()
    )


@router.post("/contract/confirm", summary="确认合同")
def confirm_contract(
        request: ConfirmContractRequest,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """确认合同（房东或租客）"""
    contract = db.query(ContractModel).filter(
        ContractModel.id == request.contract_id
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    if current_user.id not in [contract.tenant_id, contract.landlord_id]:
        raise HTTPException(status_code=403, detail="无权操作此合同")

    if contract.status == 'pending_landlord' and current_user.id == contract.landlord_id:
        contract.status = 'pending_tenant'
    elif contract.status == 'pending_tenant' and current_user.id == contract.tenant_id:
        contract.status = 'active'

        house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
        if house:
            house.status = 'rented'
            house.updated_at = datetime.utcnow()

        generate_rent_records(db, contract)
    else:
        raise HTTPException(status_code=400, detail=f"合同当前状态为：{get_status_label(contract.status)}，无法确认")

    contract.updated_at = datetime.utcnow()
    db.commit()

    house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
    tenant = db.query(UserModel).filter(UserModel.id == contract.tenant_id).first()
    landlord = db.query(UserModel).filter(UserModel.id == contract.landlord_id).first()

    contract_data = ContractSchema(
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

    return ApiResponse(
        code=200,
        message="合同确认成功",
        data=contract_data.dict()
    )


@router.post("/contract/{contract_id}/terminate", summary="终止合同")
def terminate_contract(
        contract_id: int,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """终止合同"""
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()

    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    if current_user.id not in [contract.tenant_id, contract.landlord_id]:
        raise HTTPException(status_code=403, detail="无权操作此合同")

    if contract.status != 'active':
        raise HTTPException(status_code=400, detail="只有生效中的合同可以终止")

    contract.status = 'terminated'
    contract.updated_at = datetime.utcnow()

    house = db.query(HouseModel).filter(HouseModel.id == contract.house_id).first()
    if house:
        house.status = 'vacant'
        house.updated_at = datetime.utcnow()

    db.commit()

    return ApiResponse(
        code=200,
        message="合同已终止",
        data=None
    )


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
