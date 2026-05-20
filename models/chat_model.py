from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base


class ChatRoomModel(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    house_id = Column(Integer, ForeignKey('houses.id'), nullable=False)
    tenant_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    landlord_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    house = relationship("HouseModel", backref="chat_rooms")
    tenant = relationship("UserModel", foreign_keys=[tenant_id], backref="tenant_chat_rooms")
    landlord = relationship("UserModel", foreign_keys=[landlord_id], backref="landlord_chat_rooms")
    messages = relationship("ChatMessageModel", backref="room", cascade="all, delete-orphan")


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey('chat_rooms.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    sender = relationship("UserModel", backref="messages")
