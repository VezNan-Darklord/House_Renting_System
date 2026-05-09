from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from models.database import get_db
from models.schemas import (
    House as HouseSchema,
    HouseRequest,
    HouseListItem,
    UpdateHouseStatusRequest,
    ImageUploadResponse,
    PaginatedResponse
)
from models.user_model import UserModel
from models.house_model import HouseModel
from utils.auth import get_current_user, get_current_landlord
from datetime import datetime
import os
import uuid

router = APIRouter(prefix="/api/houses", tags=["房源"])

# 图片上传目录
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", summary="发布房源", status_code=status.HTTP_201_CREATED)
def create_house(
        request: HouseRequest,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """房东发布新房源"""
    new_house = HouseModel(
        landlord_id=current_user.id,
        address_province=request.address_province,
        address_city=request.address_city,
        address_district=request.address_district,
        address_detail=request.address_detail,
        house_type=request.house_type.value,
        layout=request.layout,
        area=request.area,
        monthly_rent=request.monthly_rent,
        deposit=request.deposit,
        decoration=request.decoration.value,
        facilities=request.facilities,
        description=request.description,
        images=[],
        status='vacant',
        created_at=datetime.utcnow()
    )

    db.add(new_house)
    db.commit()
    db.refresh(new_house)

    return {"code": 200, "message": "房源发布成功", "data": {"house_id": new_house.id}}


@router.get("/my", summary="我的房源列表")
def get_my_houses(
        page: int = 1,
        page_size: int = 10,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """房东查看自己发布的房源"""
    offset = (page - 1) * page_size

    houses = db.query(HouseModel).filter(
        HouseModel.landlord_id == current_user.id,
        HouseModel.is_deleted == False
    ).offset(offset).limit(page_size).all()

    total = db.query(HouseModel).filter(
        HouseModel.landlord_id == current_user.id,
        HouseModel.is_deleted == False
    ).count()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            HouseListItem(
                id=house.id,
                cover_image=house.images[0] if house.images else "",
                layout=house.layout,
                address_summary=f"{house.address_province}{house.address_city}{house.address_district}",
                monthly_rent=house.monthly_rent,
                area=house.area,
                status=house.status,
                status_label=get_status_label(house.status),
                created_at=house.created_at
            )
            for house in houses
        ]
    }


@router.get("", summary="公开房源列表")
def get_public_houses(
        page: int = 1,
        page_size: int = 10,
        db: Session = Depends(get_db)
):
    """公开的房源列表（无需登录）"""
    offset = (page - 1) * page_size

    houses = db.query(HouseModel).filter(
        HouseModel.is_deleted == False,
        HouseModel.status != 'maintenance'
    ).order_by(HouseModel.created_at.desc()).offset(offset).limit(page_size).all()

    total = db.query(HouseModel).filter(
        HouseModel.is_deleted == False,
        HouseModel.status != 'maintenance'
    ).count()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            HouseListItem(
                id=house.id,
                cover_image=house.images[0] if house.images else "",
                layout=house.layout,
                address_summary=f"{house.address_province}{house.address_city}{house.address_district}",
                monthly_rent=house.monthly_rent,
                area=house.area,
                status=house.status,
                status_label=get_status_label(house.status),
                created_at=house.created_at
            )
            for house in houses
        ]
    }


@router.get("/{house_id}", summary="房源详情")
def get_house_detail(house_id: int, db: Session = Depends(get_db)):
    """获取房源详细信息"""
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在")

    # 获取房东信息
    landlord = db.query(UserModel).filter(UserModel.id == house.landlord_id).first()

    return HouseSchema(
        id=house.id,
        landlord_id=house.landlord_id,
        landlord_nickname=landlord.nickname if landlord else "",
        address_province=house.address_province,
        address_city=house.address_city,
        address_district=house.address_district,
        address_detail=house.address_detail,
        house_type=house.house_type,
        layout=house.layout,
        area=house.area,
        monthly_rent=house.monthly_rent,
        deposit=house.deposit,
        decoration=house.decoration,
        facilities=house.facilities or [],
        description=house.description or "",
        images=house.images or [],
        status=house.status,
        is_deleted=house.is_deleted,
        created_at=house.created_at,
        updated_at=house.updated_at
    )


@router.put("/{house_id}", summary="编辑房源")
def update_house(
        house_id: int,
        request: HouseRequest,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """房东编辑自己的房源"""
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.landlord_id == current_user.id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在或无权操作")

    # 更新字段
    house.address_province = request.address_province
    house.address_city = request.address_city
    house.address_district = request.address_district
    house.address_detail = request.address_detail
    house.house_type = request.house_type.value
    house.layout = request.layout
    house.area = request.area
    house.monthly_rent = request.monthly_rent
    house.deposit = request.deposit
    house.decoration = request.decoration.value
    house.facilities = request.facilities
    house.description = request.description
    house.updated_at = datetime.utcnow()

    db.commit()

    return {"code": 200, "message": "房源更新成功"}


@router.delete("/{house_id}", summary="删除房源")
def delete_house(
        house_id: int,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """软删除房源"""
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.landlord_id == current_user.id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在或无权操作")

    # 检查是否有有效合同
    from models.contract_model import ContractModel
    active_contract = db.query(ContractModel).filter(
        ContractModel.house_id == house_id,
        ContractModel.status.in_(['active', 'pending_tenant'])
    ).first()

    if active_contract:
        raise HTTPException(status_code=400, detail="该房源有进行中的合同，无法删除")

    house.is_deleted = True
    house.updated_at = datetime.utcnow()
    db.commit()

    return {"code": 200, "message": "房源删除成功"}


@router.put("/{house_id}/status", summary="更新房源状态")
def update_house_status(
        house_id: int,
        request: UpdateHouseStatusRequest,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """更新房源状态（空置/维修中）"""
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.landlord_id == current_user.id
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在或无权操作")

    house.status = request.status.value
    house.updated_at = datetime.utcnow()
    db.commit()

    return {"code": 200, "message": "状态更新成功"}


@router.post("/upload-image", summary="上传图片")
async def upload_image(
        file: UploadFile = File(...),
        current_user: UserModel = Depends(get_current_landlord)
):
    """上传房源图片"""
    # 生成唯一文件名
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{file_extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # 保存文件
    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # 返回访问URL
    image_url = f"/uploads/{filename}"

    return ImageUploadResponse(urls=[image_url])


def get_status_label(status: str) -> str:
    """获取状态中文标签"""
    labels = {
        'vacant': '空置',
        'rented': '已出租',
        'maintenance': '维修中'
    }
    return labels.get(status, status)
