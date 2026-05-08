from sqlalchemy import Column, Integer, String, Enum, Float, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class ContractModel(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    house_id = Column(Integer, ForeignKey('houses.id'), nullable=False)
    tenant_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    landlord_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    monthly_rent = Column(Float, nullable=False)
    deposit = Column(Float, nullable=False)
    terms = Column(Text, nullable=False)
    status = Column(
        Enum('pending_landlord', 'pending_tenant', 'active', 'terminated'),
        default='pending_landlord'
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    house = relationship("HouseModel", backref="contracts")
    tenant = relationship("UserModel", foreign_keys=[tenant_id], backref="tenant_contracts")
    landlord = relationship("UserModel", foreign_keys=[landlord_id], backref="landlord_contracts")
    rent_records = relationship("RentRecordModel", back_populates="contract")
