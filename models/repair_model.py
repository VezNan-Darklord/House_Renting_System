from sqlalchemy import Column, Integer, String, Enum, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class RepairModel(Base):
    __tablename__ = "repairs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    house_id = Column(Integer, ForeignKey('houses.id'), nullable=False)
    tenant_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    description = Column(Text, nullable=False)
    urgency = Column(Enum('normal', 'urgent'), default='normal')
    status = Column(Enum('pending', 'processing', 'completed'), default='pending')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    house = relationship("HouseModel", backref="repairs")
    tenant = relationship("UserModel", backref="repairs")
