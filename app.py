from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.database import engine, Base

# 创建所有表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="智能房屋租赁系统 API",
    description="前后端分离的租赁平台后端",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境改为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes.auth import router as auth_router
app.include_router(auth_router)

from routes.user import router as user_router
app.include_router(user_router)

from routes.house import router as house_router
app.include_router(house_router)

from routes.search import router as search_router
app.include_router(search_router)

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
@app.get("/")
def root():
    return {
        "message": "智能房屋租赁系统 API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
