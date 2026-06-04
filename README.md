# 🏠 智能房屋租赁系统 (House Renting System)

> 面向房东 / 租客 / 管理员三类角色的全流程房屋租赁平台，覆盖房源发布、合同签订、租金结算、维修工单、投诉处理等核心场景。

## ✨ 项目亮点

- **三端协同**：单一后端同时服务 Web 前端、Android 端、第三方调用方（`api.json` 暴露 OpenAPI 3.1 规范）
- **全流程业务闭环**：浏览 → 咨询 → 签约 → 履约 → 缴费 → 退租 → 评价，状态机驱动
- **实时通信**：基于 Socket.IO 的聊天室，发起租房 / 报修 / 投诉自动推送消息
- **细粒度权限**：FastAPI Depends 注入 + JWT，统一收口 `tenant` / `landlord` / `admin` 三种角色
- **前后端契约自动化**：后端 `openapi.json` → 前端 `npm run openapi` 一键生成 TypeScript SDK

---

## 🧱 技术栈

### 后端 (`/`)
| 类别       | 技术                                |
| ---------- | ----------------------------------- |
| Web 框架   | FastAPI 0.104+                      |
| ASGI       | Uvicorn                             |
| 实时通信   | python-socketio 5.x                 |
| ORM        | SQLAlchemy 2.x                      |
| 数据库     | MySQL 8 (PyMySQL 驱动)              |
| 鉴权       | JWT (python-jose) + bcrypt          |
| 数据校验   | Pydantic v2 (含 email 校验)         |
| 配置       | python-dotenv + 自定义 `config.py`  |

### 前端 (`/frontend`)
| 类别        | 技术                                            |
| ----------- | ----------------------------------------------- |
| 构建        | Vite 8 + React 19 + TypeScript 6                |
| UI 组件     | Ant Design 5.26                                 |
| 数据请求    | TanStack Query 5 (react-query)                  |
| 路由        | react-router 7                                  |
| 实时通信    | socket.io-client 4.8                            |
| 样式        | Tailwind CSS 4 + Ant Design Token               |
| 代码生成    | openapi-typescript-codegen                       |
| 时间处理    | dayjs                                           |

---

## 🎯 功能模块

### 👤 普通用户（未登录）
- 浏览首页（`/`）：房源列表 + 多维筛选（关键词 / 户型 / 区域 / 租金区间 / 面积区间 / 房源类型 / 装修）
- 房源详情（`/house/:id`）：查看房屋图片、设施、地图位置
- 注册 / 登录

### 🧑‍💼 租客 (tenant)
| 功能 | 入口 | 关键流程 |
| --- | --- | --- |
| **租房管理** | `/user` → 租住信息 | 浏览可租房源 → 发起租房 → 自动给房东发消息 → 等待房东确认 |
| **合同签署** | 同上 | 房东确认后进入 `pending_tenant` → 租客点击签署 → `active` 生效 |
| **租金记录** | `/user` → 租金记录 | 合同生效后系统自动生成 12 期账单 → 线下支付 → 标记已支付 / 提醒付款 |
| **维修工单** | `/user` → 维修工单 | 提交报修（限当前 active 合同的房源）→ 房东推进 pending → processing → completed |
| **投诉** | `/user` → 我的投诉 | 投诉房源 / 房东 / 其他 → 管理员处理后查看反馈 |
| **个人中心** | `/user` → 账号信息 | 编辑资料、改密码、查看自己的合同与租金概览 |
| **实时聊天** | `/chat` | 与房东点对点沟通，房源详情页可"联系房东"创建聊天室 |

### 🏠 房东 (landlord)
| 功能 | 入口 | 关键流程 |
| --- | --- | --- |
| **房源发布** | `/house/publish` | 录入地址、户型、面积、月租、押金、装修、设施、多图上传 |
| **房源管理** | `/user` → 房屋管理 | 上下架、状态切换（vacant / rented / maintenance） |
| **收到的合同** | `/user` → 租住信息 | 审核租客申请 → 确认 → 租客签署 → 终止 |
| **收到的工单** | `/user` → 维修工单 | 处理报修申请，更新工单状态 |
| **租金催收** | `/user` → 租金记录 | 提醒未支付租客 |
| **资料维护** | `/user` → 账号信息 | 维护个人资料、改密码 |

### 🛡️ 管理员 (admin)
登录后被 `AuthGuard` 自动从 `/user` 重定向到 `/admin`：

| 功能 | 入口 | 关键能力 |
| --- | --- | --- |
| **用户管理** | `/admin` → 用户管理 | 4 列卡片网格，按角色 Tag 筛选（全部/管理员/房东/租客），重置任意用户密码 |
| **投诉处理** | `/admin` → 投诉处理 | 查看所有投诉，填写反馈，状态变更为 `resolved` |
| **系统日志** | （API 预留）`GET /api/v1/admin/logs` | 分页查询操作日志（按时间 / 用户） |

---

## 🏗 系统架构

### 整体分层

```
┌────────────────────────────────────────────────────────────────────┐
│                          Browser (Vite :5173)                      │
│   React 19 + AntD 5 + TanStack Query + Socket.IO Client            │
└──────────┬─────────────────────────────────────────┬───────────────┘
           │ HTTPS / JSON                             │ WSS
           ▼                                          ▼
┌────────────────────────────────────────────────────────────────────┐
│           FastAPI + python-socketio (Uvicorn :8000)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   auth   │ │  house   │ │ contract │ │  repair  │ │ complaint│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   rent   │ │  search  │ │   chat   │ │   user   │ │  admin   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                            │                                       │
│              SQLAlchemy ORM + Pydantic Schemas                     │
│                            │                                       │
│                            ▼                                       │
│                     MySQL 8 (rental_system)                        │
└────────────────────────────────────────────────────────────────────┘
```

### 后端模块依赖图

```
                    ┌──────────────┐
                    │   app.py     │  FastAPI + CORS + Socket.IO 装配
                    └──────┬───────┘
                           │ include_router
        ┌────────┬─────────┼─────────┬─────────┬─────────┐
        ▼        ▼         ▼         ▼         ▼         ▼
      auth     house     search    contract    rent    repair
        │        │         │         │         │         │
        │        │         │         ▼         │         │
        │        │         │      chat(socket)│         │
        │        │         │         │         │         │
        └────────┴─────────┴────┬────┴─────────┴─────────┘
                                ▼
                          complaint / admin
                                ▼
                       models/*_model.py  (SQLAlchemy ORM)
                                ▼
                       MySQL 8 (utf8mb4)
```

### 关键业务状态机

**合同 (`ContractStatus`)**
```
pending_landlord ──房东确认──▶ pending_tenant ──租客签署──▶ active ──双方终止──▶ terminated
```

**维修工单 (`RepairStatus`)**
```
pending ──房东开始处理──▶ processing ──房东标记完成──▶ completed
```

**投诉 (`ComplaintStatus`)**
```
pending ──管理员填写反馈──▶ resolved
```

**租金 (`RentStatus`)**
```
unpaid ──租客确认线下付款──▶ paid
```

---

## 📁 目录结构

```
House_Renting_System/
├── app.py                       # FastAPI 入口 + CORS + Socket.IO 装配
├── config.py                    # 配置（JWT / DATABASE_URL）
├── init_db.py                   # 一键建库脚本
├── openapi.json                 # OpenAPI 3.1 规范（前端 SDK 生成源）
├── api.json                     # 兼容版 API 描述
├── requirement.txt
├── models/                      # SQLAlchemy ORM + Pydantic Schema
│   ├── database.py              # 引擎、会话、Base
│   ├── user_model.py
│   ├── house_model.py
│   ├── contract_model.py
│   ├── rent_model.py
│   ├── repair_model.py
│   ├── complaint_model.py
│   ├── chat_model.py
│   ├── log_model.py
│   └── schemas.py               # 所有请求/响应模型 + 枚举
├── routes/                      # FastAPI 路由层
│   ├── auth.py
│   ├── user.py
│   ├── house.py
│   ├── search.py
│   ├── contract.py
│   ├── rent.py
│   ├── repair.py
│   ├── complaint.py
│   ├── chat.py
│   └── admin.py
├── utils/
│   ├── auth.py                  # JWT / bcrypt / 角色守卫
│   └── image_handler.py         # 多图上传
├── migrations/                  # （建议）Alembic 版本控制
├── uploads/                     # 房源图片静态目录
└── frontend/
    ├── api/                     # 由 openapi.json 自动生成
    ├── src/
    │   ├── app.tsx              # 路由表
    │   ├── main.tsx             # 入口
    │   ├── global.css
    │   ├── components/
    │   │   ├── userContext.tsx      # 登录态 Context
    │   │   ├── index/               # 首页、Header、Sidebar、登录注册
    │   │   ├── houseDetail/         # 房源详情
    │   │   ├── publishHouse/        # 房源发布
    │   │   ├── chat/                # 聊天室（Socket.IO）
    │   │   ├── common/              # AuthGuard / PopWindow / DefaultContract
    │   │   ├── personal/            # 租客 / 房东个人中心
    │   │   │   ├── accountInfo.tsx
    │   │   │   ├── rentHouseManage.tsx   # 合同管理
    │   │   │   ├── rentRecords.tsx       # 租金记录
    │   │   │   ├── repairWorkOrder.tsx   # 维修工单
    │   │   │   ├── complaint.tsx         # 我的投诉
    │   │   │   └── userCard.tsx          # 个人中心侧边栏
    │   │   └── admin/                  # 管理员后台
    │   │       ├── adminCard.tsx
    │   │       ├── userManagement.tsx   # 4 列用户网格
    │   │       └── adminComplaint.tsx   # 投诉处理
    │   └── ...
    ├── scripts/correctService.js # SDK 生成后修正
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 快速开始

### 1. 准备环境

| 依赖       | 版本         |
| ---------- | ------------ |
| Python     | 3.10+        |
| MySQL      | 8.0+         |
| Node.js    | 20+          |
| pnpm / npm | 任一         |

### 2. 启动后端

```bash
# 进入项目根目录
cd House_Renting_System

# 创建虚拟环境
python -m venv venv
.\venv\Scripts\activate            # Windows
# source venv/bin/activate         # macOS / Linux

# 安装依赖
pip install -r requirement.txt

# 配置 .env
#   DB_USER / DB_PASSWORD / DB_HOST / DB_PORT / DB_NAME
#   SECRET_KEY (生产环境务必替换)

# 初始化数据库
python init_db.py

# 启动服务
python app.py
# 或 uvicorn app:socket_app --reload --host 0.0.0.0 --port 8000
```

后端默认地址：`http://127.0.0.1:8000`
API 文档：`http://127.0.0.1:8000/api/v1/docs`

### 3. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install            # 或 npm install

# 重新生成 SDK（可选，openapi.json 变更后）
npm run openapi

# 启动
npm run dev
# 默认 http://localhost:5173
```

---

## 🔐 默认账号 & 角色

| 角色   | 注册时选择           | 可见模块             |
| ------ | -------------------- | -------------------- |
| 租客   | `tenant`             | 个人中心 5 个 sideItem + 聊天 |
| 房东   | `landlord`           | 同上 + 房源发布入口  |
| 管理员 | 需手动修改数据库     | 自动跳转到 `/admin`  |

---

## 📐 关键设计决策

| 主题       | 决策 | 原因 |
| ---------- | ---- | ---- |
| 状态机     | 合同 / 维修 / 投诉均显式建模为枚举状态 + 转换守卫 | 业务规则集中在后端，前端无状态判断 |
| 权限       | FastAPI Depends 注入 `get_current_tenant` / `get_current_landlord` / `get_current_admin` | 路由层声明式鉴权，可读性高 |
| 实时通信   | Socket.IO 单 namespace (`default`)，按 `room_id` 划分房间 | 兼容弱网与轮询，聊天和工单通知同通道 |
| 前后端契约 | 后端暴露 `openapi.json` → 前端 `openapi-typescript-codegen` 自动生成 `frontend/api/` | 接口变更只需 `npm run openapi` 同步 |
| CORS       | `app.py` 全局 `CORSMiddleware(allow_origins=["*"], allow_methods=["*"])` | 开发期免配置；生产应改为具体域名 |
| 报错规范   | 统一 `ApiResponse { code, message, data }` | 前端可按 `code` 做业务分支，HTTP 状态码仅表示网络层 |

---

## 🧪 接口一览（节选）

| 模块       | Method | 路径                          | 角色           |
| ---------- | ------ | ----------------------------- | -------------- |
| 认证       | POST   | `/api/v1/auth/register`       | 公开           |
| 认证       | POST   | `/api/v1/auth/login`          | 公开           |
| 用户       | GET    | `/api/v1/user/profile`        | 已登录         |
| 房源       | POST   | `/api/v1/house/publish`       | 房东           |
| 房源       | GET    | `/api/v1/house/list`          | 已登录         |
| 搜索       | POST   | `/api/v1/search/houses`       | 已登录         |
| 合同       | POST   | `/api/v1/contract`            | 租客           |
| 合同       | POST   | `/api/v1/contract/confirm`    | 双方           |
| 租金       | GET    | `/api/v1/rent/list`           | 双方           |
| 租金       | POST   | `/api/v1/rent/confirm-payment`| 租客           |
| 维修       | POST   | `/api/v1/repair`              | 租客           |
| 维修       | PATCH  | `/api/v1/repair/{id}/status`  | 房东           |
| 投诉       | POST   | `/api/v1/complaint`           | 租客           |
| 投诉       | POST   | `/api/v1/complaint/handle`    | 管理员         |
| 管理员     | GET    | `/api/v1/admin/users`         | 管理员         |
| 管理员     | POST   | `/api/v1/admin/reset-password`| 管理员         |

---

## 📜 License

MIT
