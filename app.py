from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
import socketio

from models.database import engine, Base, SessionLocal
from models.user_model import UserModel
from models.chat_model import ChatRoomModel, ChatMessageModel
from utils.auth import decode_access_token

# 创建所有表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="智能房屋租赁系统 API",
    description="前后端分离的租赁平台后端",
    version="1.0.0",
    docs_url="/api/v1",
    redoc_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境改为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from routes.auth import router as auth_router
app.include_router(auth_router)

from routes.user import router as user_router
app.include_router(user_router)

from routes.house import router as house_router
app.include_router(house_router)

from routes.search import router as search_router
app.include_router(search_router)

from routes.chat import router as chat_router
app.include_router(chat_router)

from routes.contract import router as contract_router
app.include_router(contract_router)

from routes.rent import router as rent_router
app.include_router(rent_router)

from routes.repair import router as repair_router
app.include_router(repair_router)

from routes.complaint import router as complaint_router
app.include_router(complaint_router)

from routes.admin import router as admin_router
app.include_router(admin_router)

SIO_ROOM_NAMESPACE = None
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

def _coerce_room_id(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def _get_socket_user(token: str) -> UserModel:
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise ValueError("Token 缺少用户ID")
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.id == int(user_id)).first()
        if not user or not user.is_active:
            raise ValueError("用户不存在或已禁用")
        return user
    finally:
        db.close()

def _get_room_for_user(db, room_id: int, user_id: int):
    room = db.query(ChatRoomModel).filter(ChatRoomModel.id == room_id).first()
    if not room:
        return None
    if room.tenant_id != user_id and room.landlord_id != user_id:
        return None
    return room

@sio.event
async def connect(sid, environ, auth):
    token = auth.get("token") if isinstance(auth, dict) else None
    if not token:
        return False
    try:
        user = _get_socket_user(token)
    except Exception:
        return False
    await sio.save_session(sid, {"user_id": user.id, "nickname": user.nickname})
    return True

@sio.event
async def join(sid, data):
    room_id = _coerce_room_id(data.get("room_id") if isinstance(data, dict) else None)
    if not room_id:
        return
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        return
    db = SessionLocal()
    try:
        room = _get_room_for_user(db, room_id, user_id)
        if not room:
            return
    finally:
        db.close()
    await sio.enter_room(sid, str(room_id), namespace=SIO_ROOM_NAMESPACE)

@sio.event
async def join_room(sid, data):
    await join(sid, data)

@sio.event
async def leave(sid, data):
    room_id = _coerce_room_id(data.get("room_id") if isinstance(data, dict) else None)
    if not room_id:
        return
    await sio.leave_room(sid, str(room_id), namespace=SIO_ROOM_NAMESPACE)

@sio.event
async def leave_room(sid, data):
    await leave(sid, data)

@sio.event
async def send_message(sid, data):
    if not isinstance(data, dict):
        return
    room_id = _coerce_room_id(data.get("room_id"))
    content = data.get("content")
    if not room_id or not content or not str(content).strip():
        return
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    sender_nickname = session.get("nickname")
    if not user_id:
        return
    db = SessionLocal()
    try:
        room = _get_room_for_user(db, room_id, user_id)
        if not room:
            return
        message = ChatMessageModel(room_id=room_id, sender_id=user_id, content=str(content).strip())
        db.add(message)
        db.commit()
        db.refresh(message)
        if not sender_nickname:
            sender = db.query(UserModel).filter(UserModel.id == user_id).first()
            sender_nickname = sender.nickname if sender else "匿名用户"
        payload = {
            "id": message.id,
            "room_id": room_id,
            "sender_id": user_id,
            "sender_nickname": sender_nickname or "匿名用户",
            "content": message.content,
            "created_at": message.created_at.isoformat() if message.created_at else None,
        }
    finally:
        db.close()
    await sio.emit("receive_message", payload, room=str(room_id), namespace=SIO_ROOM_NAMESPACE)

@app.get("/")
def root():
    return {
        "message": "智能房屋租赁系统 API",
        "version": "1.0.0",
        "docs": "/api/v1/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
app = socket_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
