from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.schemas import ChatRoom, ChatMessage, ChatHistoryResponse, ApiResponse
from models.user_model import UserModel
from models.house_model import HouseModel
from models.chat_model import ChatRoomModel, ChatMessageModel
from utils.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["聊天"])


@router.get("/chat/rooms", summary="获取聊天室列表")
def get_chat_rooms(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前用户的聊天室列表"""
    rooms = db.query(ChatRoomModel).filter(
        (ChatRoomModel.tenant_id == current_user.id) |
        (ChatRoomModel.landlord_id == current_user.id)
    ).order_by(ChatRoomModel.created_at.desc()).all()

    result = []
    for room in rooms:
        house = db.query(HouseModel).filter(HouseModel.id == room.house_id).first()

        if current_user.id == room.tenant_id:
            other_user_id = room.landlord_id
        else:
            other_user_id = room.tenant_id

        other_user = db.query(UserModel).filter(UserModel.id == other_user_id).first()

        last_message = db.query(ChatMessageModel).filter(
            ChatMessageModel.room_id == room.id
        ).order_by(ChatMessageModel.created_at.desc()).first()

        result.append(ChatRoom(
            id=room.id,
            house_id=room.house_id,
            house_info=f"{house.address_city}{house.address_district}" if house else "",
            tenant_id=room.tenant_id,
            landlord_id=room.landlord_id,
            other_user_nickname=other_user.nickname if other_user else "",
            last_message=last_message.content if last_message else None,
            last_message_time=last_message.created_at if last_message else None,
            created_at=room.created_at
        ))

    return ApiResponse(
        code=200,
        message="成功",
        data=[room.dict() for room in result]
    )


@router.get("/chat/rooms/{room_id}/messages", summary="获取历史消息")
def get_chat_history(
        room_id: int,
        page: int = 1,
        page_size: int = 10,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """获取指定聊天室的历史消息"""
    room = db.query(ChatRoomModel).filter(
        ChatRoomModel.id == room_id,
        (ChatRoomModel.tenant_id == current_user.id) |
        (ChatRoomModel.landlord_id == current_user.id)
    ).first()

    if not room:
        raise HTTPException(status_code=404, detail="聊天室不存在或无权访问")

    offset = (page - 1) * page_size

    messages = db.query(ChatMessageModel).filter(
        ChatMessageModel.room_id == room_id
    ).order_by(ChatMessageModel.created_at.desc()).offset(offset).limit(page_size).all()

    total = db.query(ChatMessageModel).filter(
        ChatMessageModel.room_id == room_id
    ).count()

    messages_list = []
    for msg in messages:
        sender = db.query(UserModel).filter(UserModel.id == msg.sender_id).first()
        messages_list.append(ChatMessage(
            id=msg.id,
            room_id=msg.room_id,
            sender_id=msg.sender_id,
            sender_nickname=sender.nickname if sender else "",
            content=msg.content,
            created_at=msg.created_at
        ))

    messages_list.reverse()

    return ApiResponse(
        code=200,
        message="成功",
        data={
            "room_id": room_id,
            "messages": [msg.dict() for msg in messages_list],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    )
