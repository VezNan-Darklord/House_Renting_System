from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional
from models.database import get_db
from models.schemas import SearchParams, SearchResult, HouseListItem
from models.house_model import HouseModel

router = APIRouter(prefix="/api/search", tags=["搜索"])


@router.get("", summary="搜索房源")
def search_houses(
        page: int = Query(1, ge=1, description="页码"),
        page_size: int = Query(10, ge=1, le=100, description="每页条数"),
        keyword: Optional[str] = Query(None, description="关键词（地址/小区名）"),
        province: Optional[str] = Query(None, description="省份"),
        city: Optional[str] = Query(None, description="城市"),
        district: Optional[str] = Query(None, description="区县"),
        layout: Optional[str] = Query(None, description="户型"),
        min_rent: Optional[float] = Query(None, ge=0, description="最低租金"),
        max_rent: Optional[float] = Query(None, ge=0, description="最高租金"),
        min_area: Optional[float] = Query(None, ge=0, description="最小面积"),
        max_area: Optional[float] = Query(None, ge=0, description="最大面积"),
        house_type: Optional[str] = Query(None, description="房源类型：apartment/residential/villa"),
        decoration: Optional[str] = Query(None, description="装修类型：luxury/simple/rough"),
        db: Session = Depends(get_db)
):
    """
    多条件搜索房源

    - 支持关键词模糊搜索
    - 支持地区精确匹配
    - 支持租金/面积范围筛选
    - 支持户型、类型、装修筛选
    """

    # 基础查询：未删除且非维修中的房源
    query = db.query(HouseModel).filter(
        HouseModel.is_deleted == False,
        HouseModel.status != 'maintenance'
    )

    # 关键词搜索（匹配地址详情）
    if keyword:
        query = query.filter(
            or_(
                HouseModel.address_detail.like(f"%{keyword}%"),
                HouseModel.address_city.like(f"%{keyword}%"),
                HouseModel.address_district.like(f"%{keyword}%")
            )
        )

    # 地区筛选
    if province:
        query = query.filter(HouseModel.address_province == province)
    if city:
        query = query.filter(HouseModel.address_city == city)
    if district:
        query = query.filter(HouseModel.address_district == district)

    # 户型筛选（模糊匹配）
    if layout:
        query = query.filter(HouseModel.layout.like(f"%{layout}%"))

    # 租金范围
    if min_rent is not None:
        query = query.filter(HouseModel.monthly_rent >= min_rent)
    if max_rent is not None:
        query = query.filter(HouseModel.monthly_rent <= max_rent)

    # 面积范围
    if min_area is not None:
        query = query.filter(HouseModel.area >= min_area)
    if max_area is not None:
        query = query.filter(HouseModel.area <= max_area)

    # 房源类型
    if house_type:
        query = query.filter(HouseModel.house_type == house_type)

    # 装修类型
    if decoration:
        query = query.filter(HouseModel.decoration == decoration)

    # 计算总数
    total = query.count()

    # 分页查询
    offset = (page - 1) * page_size
    houses = query.order_by(HouseModel.created_at.desc()).offset(offset).limit(page_size).all()

    # 构建响应
    items = [
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

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


def get_status_label(status: str) -> str:
    """获取状态中文标签"""
    labels = {
        'vacant': '空置',
        'rented': '已出租',
        'maintenance': '维修中'
    }
    return labels.get(status, status)
