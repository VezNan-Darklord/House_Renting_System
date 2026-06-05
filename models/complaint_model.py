from sqlalchemy import Column, Integer, String, Enum, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class ComplaintModel(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    landlord_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    type = Column(Enum('house', 'landlord', 'other'), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum('pending', 'resolved'), default='pending')
    admin_feedback = Column(Text, default='')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    tenant = relationship("UserModel", foreign_keys=[tenant_id], backref="complaints_as_tenant")
    landlord = relationship("UserModel", foreign_keys=[landlord_id] ,backref="complaints_as_landlord")
