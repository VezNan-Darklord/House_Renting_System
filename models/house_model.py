from sqlalchemy import Column, Integer, String, Enum, Float, Text, JSON, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class HouseModel(Base):
    __tablename__ = "houses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    landlord_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    address_province = Column(String(50), nullable=False)
    address_city = Column(String(50), nullable=False)
    address_district = Column(String(50), nullable=False)
    address_detail = Column(String(255), nullable=False)
    house_type = Column(Enum('apartment', 'residential', 'villa'), nullable=False)
    layout = Column(String(50), nullable=False)
    area = Column(Float, nullable=False)
    monthly_rent = Column(Float, nullable=False)
    deposit = Column(Float, nullable=False)
    decoration = Column(Enum('luxury', 'simple', 'rough'), nullable=False)
    facilities = Column(JSON, default=list)
    description = Column(Text, default='')
    images = Column(JSON, default=list)
    status = Column(Enum('vacant', 'rented', 'maintenance'), default='vacant')
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    landlord = relationship("UserModel", backref="houses")
