from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from models.database import get_db
from models.schemas import (
    House as HouseSchema,
    HouseRequest,
    HouseListItem,
    UpdateHouseStatusRequest,
    PaginatedResponse,
    ApiResponse
)
from models.user_model import UserModel
from models.house_model import HouseModel
from utils.auth import get_current_landlord
from datetime import datetime
import os
import uuid
import hashlib
from utils.image_handler import images_urls_to_base64, image_url_to_base64

router = APIRouter(prefix="/api/v1", tags=["房源"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/house", summary="发布房源", status_code=status.HTTP_201_CREATED)
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
        images=request.images,
        status='vacant',
        created_at=datetime.utcnow()
    )

    db.add(new_house)
    db.commit()
    db.refresh(new_house)

    house_data = HouseSchema(
        id=new_house.id,
        landlord_id=new_house.landlord_id,
        landlord_nickname=current_user.nickname,
        address_province=new_house.address_province,
        address_city=new_house.address_city,
        address_district=new_house.address_district,
        address_detail=new_house.address_detail,
        house_type=new_house.house_type,
        layout=new_house.layout,
        area=new_house.area,
        monthly_rent=new_house.monthly_rent,
        deposit=new_house.deposit,
        decoration=new_house.decoration,
        facilities=new_house.facilities or [],
        description=new_house.description or "",
        images=new_house.images or [],
        status=new_house.status,
        is_deleted=new_house.is_deleted,
        created_at=new_house.created_at,
        updated_at=new_house.updated_at
    )

    return ApiResponse(
        code=200,
        message="房源发布成功",
        data=house_data.dict()
    )


@router.get("/house/list", summary="获取房源列表")
def get_house_list(
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """获取房源列表"""
    offset = (page - 1) * page_size

    query = db.query(HouseModel).filter(HouseModel.is_deleted == False)

    if status:
        query = query.filter(HouseModel.status == status)

    houses = query.order_by(HouseModel.created_at.desc()).offset(offset).limit(page_size).all()
    total = query.count()

    items = [
        HouseListItem(
            id=house.id,
            cover_image=image_url_to_base64(house.images[0]) if house.images else "",
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


@router.get("/house/{house_id}", summary="获取房源详情")
def get_house_detail(house_id: int, db: Session = Depends(get_db)):
    """获取房源详细信息"""
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.is_deleted == False
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在")

    landlord = db.query(UserModel).filter(UserModel.id == house.landlord_id).first()

    house_data = HouseSchema(
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
        images=images_urls_to_base64(house.images or []),
        status=house.status,
        is_deleted=house.is_deleted,
        created_at=house.created_at,
        updated_at=house.updated_at
    )

    return ApiResponse(
        code=200,
        message="成功",
        data=house_data.dict()
    )


@router.put("/house/{house_id}", summary="编辑房源")
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
    house.images = request.images
    house.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(house)

    landlord = db.query(UserModel).filter(UserModel.id == house.landlord_id).first()

    house_data = HouseSchema(
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
        images=images_urls_to_base64(house.images or []),
        status=house.status,
        is_deleted=house.is_deleted,
        created_at=house.created_at,
        updated_at=house.updated_at
    )

    return ApiResponse(
        code=200,
        message="房源更新成功",
        data=house_data.dict()
    )


@router.delete("/house/{house_id}", summary="删除房源")
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

    return ApiResponse(
        code=200,
        message="房源删除成功",
        data=None
    )


@router.patch("/house/{house_id}/status", summary="更新房源状态")
def update_house_status(
        house_id: int,
        request: UpdateHouseStatusRequest,
        current_user: UserModel = Depends(get_current_landlord),
        db: Session = Depends(get_db)
):
    """更新房源状态"""
    house = db.query(HouseModel).filter(
        HouseModel.id == house_id,
        HouseModel.landlord_id == current_user.id
    ).first()

    if not house:
        raise HTTPException(status_code=404, detail="房源不存在或无权操作")

    house.status = request.status.value
    house.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(house)

    landlord = db.query(UserModel).filter(UserModel.id == house.landlord_id).first()

    house_data = HouseSchema(
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
        images=images_urls_to_base64(house.images or []),
        status=house.status,
        is_deleted=house.is_deleted,
        created_at=house.created_at,
        updated_at=house.updated_at
    )

    return ApiResponse(
        code=200,
        message="状态更新成功",
        data=house_data.dict()
    )


@router.post("/house/upload-images", summary="上传房源图片")
async def upload_images(
        files: List[UploadFile] = File(...),
        current_user: UserModel = Depends(get_current_landlord)
):
    """上传房源图片"""
    urls = []

    for file in files:
        content = await file.read()

        file_hash = hashlib.sha256(content).hexdigest()

        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"

        filename = f"{file_hash}.{file_extension}"

        filepath = os.path.join(UPLOAD_DIR, filename)

        if not os.path.exists(filepath):
            with open(filepath, "wb") as buffer:
                buffer.write(content)

        image_url = f"/uploads/{filename}"
        urls.append(image_url)

    return ApiResponse(
        code=200,
        message="图片上传成功",
        data={"urls": urls}
    )


def get_status_label(status: str) -> str:
    """获取状态中文标签"""
    labels = {
        'vacant': '空置',
        'rented': '已出租',
        'maintenance': '维修中'
    }
    return labels.get(status, status)
