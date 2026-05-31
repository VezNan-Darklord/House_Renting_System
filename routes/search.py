from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from models.database import get_db
from models.schemas import HouseListItem, SearchResult, ApiResponse
from models.house_model import HouseModel
from models.schemas import HouseType, DecorationType
from utils.image_handler import image_url_to_base64

router = APIRouter(prefix="/api/v1", tags=["搜索"])


@router.get("/search/houses", summary="搜索房源")
def search_houses(
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        keyword: Optional[str] = Query(None),
        layout: Optional[str] = Query(None),
        province: Optional[str] = Query(None),
        city: Optional[str] = Query(None),
        district: Optional[str] = Query(None),
        min_rent: Optional[float] = Query(None, ge=0),
        max_rent: Optional[float] = Query(None, ge=0),
        min_area: Optional[float] = Query(None, ge=0),
        max_area: Optional[float] = Query(None, ge=0),
        house_type: Optional[HouseType] = Query(None),
        decoration: Optional[DecorationType] = Query(None),
        db: Session = Depends(get_db)
):
    """多条件搜索房源"""

    query = db.query(HouseModel).filter(
        HouseModel.is_deleted == False,
        HouseModel.status != 'maintenance'
    )

    if keyword:
        query = query.filter(
            or_(
                HouseModel.address_detail.like(f"%{keyword}%"),
                HouseModel.address_city.like(f"%{keyword}%"),
                HouseModel.address_district.like(f"%{keyword}%")
            )
        )

    if province:
        query = query.filter(HouseModel.address_province == province)
    if city:
        query = query.filter(HouseModel.address_city == city)
    if district:
        query = query.filter(HouseModel.address_district == district)

    if layout:
        query = query.filter(HouseModel.layout.like(f"%{layout}%"))

    if min_rent is not None:
        query = query.filter(HouseModel.monthly_rent >= min_rent)
    if max_rent is not None:
        query = query.filter(HouseModel.monthly_rent <= max_rent)

    if min_area is not None:
        query = query.filter(HouseModel.area >= min_area)
    if max_area is not None:
        query = query.filter(HouseModel.area <= max_area)

    if house_type:
        query = query.filter(HouseModel.house_type == house_type.value)

    if decoration:
        query = query.filter(HouseModel.decoration == decoration.value)

    total = query.count()

    offset = (page - 1) * page_size
    houses = query.order_by(HouseModel.created_at.desc()).offset(offset).limit(page_size).all()

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
            "items": [item.dict() for item in items]
        }
    )


def get_status_label(status: str) -> str:
    """获取状态中文标签"""
    labels = {
        'vacant': '空置',
        'rented': '已出租',
        'maintenance': '维修中'
    }
    return labels.get(status, status)
