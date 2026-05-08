from sqlalchemy import Column, Integer, String, Enum, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class RentRecordModel(Base):
    __tablename__ = "rent_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contract_id = Column(Integer, ForeignKey('contracts.id'), nullable=False)
    month = Column(String(7), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum('unpaid', 'paid'), default='unpaid')
    paid_at = Column(DateTime, nullable=True)

    contract = relationship("ContractModel", back_populates="rent_records")
