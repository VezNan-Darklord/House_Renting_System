from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(
    title="测试 API",
    description="前后端分离的测试接口",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageRequest(BaseModel):
    message: str
    timestamp: Optional[str] = None


class MessageResponse(BaseModel):
    status: str
    received: dict
    echo: str
    server_time: str


@app.get("/")
def root():
    return {
        "message": "API 服务运行中",
        "version": "1.0.0",
        "endpoints": {
            "hello": "/api/hello",
            "test_get": "/api/test/get",
            "test_post": "/api/test/post"
        }
    }


@app.get("/api/hello")
def hello_world():
    return {
        "status": "success",
        "message": "Hello World!",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/test/get")
def test_get():
    data = {
        "id": 1,
        "name": "测试数据",
        "items": ["项目1", "项目2", "项目3"],
        "metadata": {
            "created_at": "2026-05-08",
            "type": "sample",
            "count": 3
        }
    }
    return {
        "status": "success",
        "data": data,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/test/post", response_model=MessageResponse)
def test_post(request: MessageRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="消息不能为空")

    return MessageResponse(
        status="success",
        received={
            "message": request.message,
            "timestamp": request.timestamp
        },
        echo=f"你发送的是: {request.message}",
        server_time=datetime.now().isoformat()
    )


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FastAPI Backend",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
