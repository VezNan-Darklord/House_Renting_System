# 🏠 智能房屋租赁系统 · 前端 (House Renting System — Frontend)

> React 19 + TypeScript 6 + Vite 8 + Ant Design 5 + TanStack Query 5

## 📦 技术栈

| 类别         | 选型                                                  |
| ------------ | ----------------------------------------------------- |
| 框架         | React 19 + TypeScript 6                               |
| 构建工具     | Vite 8 + @vitejs/plugin-react                         |
| UI 组件库    | Ant Design 5.26 + 自研 Tailwind 4 主题                |
| 数据请求     | TanStack Query 5（devtools 集成）                     |
| 路由         | react-router 7（`createBrowserRouter`）               |
| 实时通信     | socket.io-client 4.8（聊天室 + 系统通知）            |
| 时间处理     | dayjs 1.11                                            |
| 行政区数据   | region-data                                           |
| 类型 SDK     | openapi-typescript-codegen（从后端 `openapi.json` 生成） |

---

## ✨ 已实现的核心模块

| 模块           | 组件                            | 角色          | 关键交互 |
| -------------- | ------------------------------- | ------------- | -------- |
| 首页 / 搜索    | `index/*`                       | 公开          | 关键词 + 多维筛选（户型/区域/租金/面积/装修） |
| 房源详情       | `houseDetail/*`                 | 公开          | 轮播、设施、联系房东（创建聊天室） |
| 房源发布       | `publishHouse/*`                | 房东          | 区域级联、表单校验、多图上传 |
| 个人中心侧栏   | `personal/userCard.tsx`         | 租客 / 房东   | 5 个 sideItem 切换视图 |
| 账号信息       | `personal/accountInfo.tsx`      | 全部          | 资料编辑、改密码、概览 |
| 合同管理       | `personal/rentHouseManage.tsx`  | 租客 / 房东   | 列表 + 状态机 + 详情弹窗 + Socket 通知 |
| 租金记录       | `personal/rentRecords.tsx`      | 租客 / 房东   | 状态筛选 + 确认付款 / 提醒付款 |
| 维修工单       | `personal/repairWorkOrder.tsx`  | 租客 / 房东   | 提交报修 + 状态推进 |
| 我的投诉       | `personal/complaint.tsx`        | 租客          | 提交投诉 + 反馈查看 |
| 聊天室         | `chat/chatRoom.tsx`             | 全部          | Socket.IO 房间 + 发起租房快捷入口 |
| 管理员后台     | `admin/adminCard.tsx`           | 管理员        | 侧栏 3 项：用户管理 / 投诉处理 / 返回首页 |
| 用户管理       | `admin/userManagement.tsx`      | 管理员        | 4 列响应式网格 + 角色 Segmented + 重置密码 |
| 投诉处理       | `admin/adminComplaint.tsx`      | 管理员        | 列表 + 反馈填写 |

---

## 🏗 前端架构

### 分层

```
┌────────────────────────────────────────────────────────────┐
│  pages / components (UI 层)                                │
│  ┌─────────────┬──────────────┬──────────────┬──────────┐  │
│  │ index/      │ houseDetail/ │ publishHouse/│ chat/    │  │
│  │ personal/   │ admin/       │ common/      │ userCtx  │  │
│  └─────────────┴──────────────┴──────────────┴──────────┘  │
└──────────┬────────────────────────────────────────┬────────┘
           │ 调用 hooks                            │ 订阅 Context
           ▼                                        ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│  api/hooks/* (数据访问层)    │    │ userContext.tsx         │
│  TanStack Query              │    │ 登录态 + token 持久化   │
│  - useXxxQuery               │    └─────────────────────────┘
│  - useXxxMutation            │
└──────────┬───────────────────┘
           │ 类型化调用
           ▼
┌──────────────────────────────┐
│  api/services/* (自动生成)   │  ← openapi-typescript-codegen
│  api/models/*                │
└──────────┬───────────────────┘
           │ fetch
           ▼
     FastAPI 后端 (8000)
```

### 路由表

| 路径              | 组件                       | 鉴权        |
| ----------------- | -------------------------- | ----------- |
| `/`               | `index`                    | 公开        |
| `/user`           | `userCard`（侧栏个人中心） | 已登录；管理员自动跳转 `/admin` |
| `/admin`          | `adminCard`                | 管理员      |
| `/chat`           | `chatRoom`                 | 已登录      |
| `/chat/:id`       | `chatRoom`（指定房间）     | 已登录      |
| `/house/publish`  | `publish`                  | 房东        |
| `/house/:id`      | `houseDetail`              | 公开        |

### 数据流（以"提交维修工单"为例）

```
RepairWorkOrder.tsx (UI)
    │  onClick 提交维修
    ▼
setSubmissionOpen(true) → 打开 <RepairApplicationModal>
    │  Form onFinish
    ▼
useCreateRepairMutation().mutateAsync({ house_id, description, urgency })
    │  TanStack Query mutation
    ▼
rent.repair.createRepair(body)              ← 自动生成
    │  fetch POST /api/v1/repair
    ▼
后端：creates ComplaintModel / RepairModel
    │  200 + ApiResponse
    ▼
onSuccess → 列表 refetch → UI 自动更新
```

### 个人中心布局

```
┌─────────────┬──────────────────────────────────────┐
│  侧栏 260px  │  主内容区                              │
│              │                                       │
│  返回首页     │   <AccountInfo />                     │
│  账号信息     │   <RentHouseManage />  (合同管理)     │
│  房屋/租住信息 │   <RentRecords />      (租金)         │
│  租金记录     │   <RepairWorkOrder />  (维修)         │
│  维修工单     │   <Complaint />        (投诉)         │
│  我的投诉     │                                       │
└─────────────┴──────────────────────────────────────┘
```

### 管理员后台布局

```
┌─────────────┬──────────────────────────────────────┐
│  侧栏        │  主内容区                              │
│              │                                       │
│  返回首页     │   <UserManagement />                  │
│  用户管理     │     - 角色 Segmented 筛选              │
│  投诉处理     │     - xl:grid-cols-4 用户卡片          │
│              │     - 重置密码 Modal                   │
│              │                                       │
│              │   <AdminComplaint />                  │
│              │     - 状态 Segmented 筛选              │
│              │     - 投诉卡片 + 处理反馈 Modal         │
└─────────────┴──────────────────────────────────────┘
```

### 状态机统一范式

| 业务     | 状态枚举                            | 转换守卫（路由层）            |
| -------- | ----------------------------------- | ----------------------------- |
| 合同     | `pending_landlord → pending_tenant → active → terminated` | 房东 / 租客分别有"确认"按钮 |
| 维修     | `pending → processing → completed`  | 房东推进                      |
| 投诉     | `pending → resolved`                | 管理员处理                    |
| 租金     | `unpaid → paid`                     | 租客确认线下付款              |

UI 层只做显示，所有转换都由后端在 `routes/*` 路由里校验。

---

## 📁 目录结构（精简）

```
frontend/
├── api/                                # openapi-typescript-codegen 自动生成
│   ├── services/                       # 12 个 service（auth/house/contract/...）
│   ├── models/                         # 请求/响应/枚举类型
│   ├── core/                           # fetch 封装
│   └── instance.ts                     # 配置 baseURL / token 注入
├── scripts/correctService.js           # 生成 SDK 后做修正
├── public/
├── src/
│   ├── app.tsx                         # 路由表
│   ├── main.tsx                        # React 入口 + QueryClientProvider
│   ├── global.css                      # Tailwind 4 + AntD 主题
│   └── components/
│       ├── userContext.tsx             # 登录态
│       ├── common/
│       │   ├── AuthGuard.tsx           # 登录守卫 + 管理员重定向
│       │   ├── PopWindow.tsx           # 通用弹窗（基于 portal）
│       │   └── defaultContract.tsx     # 聊天室"发起租房"表单
│       ├── index/                      # 首页 + 头部 + 侧栏 + 登录注册
│       ├── houseDetail/                # 房源详情
│       ├── publishHouse/               # 房源发布
│       ├── chat/chatRoom.tsx           # Socket.IO 聊天室
│       ├── personal/                   # 租客/房东 个人中心
│       │   ├── accountInfo.tsx
│       │   ├── rentHouseManage.tsx     # 合同管理（含 RentApplicationModal / ContractDetailModal）
│       │   ├── rentRecords.tsx
│       │   ├── repairWorkOrder.tsx
│       │   ├── complaint.tsx
│       │   ├── userCard.tsx            # 侧栏 + 视图切换
│       │   ├── contractSign.ts         # 状态/颜色/格式化常量
│       │   ├── contractPopwindow.tsx   # 合同详情弹窗
│       │   └── repairDetailPopWindow.tsx
│       └── admin/
│           ├── adminCard.tsx           # 管理员侧栏 + 路由
│           ├── userManagement.tsx
│           └── adminComplaint.tsx
├── eslint.config.js
├── tsconfig.{json,app.json,node.json}
├── vite.config.ts
└── package.json
```

---

## 🚀 快速开始

```bash
# 安装依赖
pnpm install   # 或 npm install / yarn

# （可选）当后端 openapi.json 变更时，重新生成 SDK
npm run openapi
#   openapi-typescript-codegen --input ../openapi.json --output ./api ...
#   + node ./scripts/correctService.js 做兼容修正

# 启动开发服务器
npm run dev                # http://localhost:5173

# 类型检查 + 生产构建
npm run build              # tsc -b && vite build

# Lint
npm run lint

# 预览生产构建
npm run preview
```

### 环境变量

默认 baseURL 指向 `http://127.0.0.1:8000`（见 `api/instance.ts`）。如需修改可直接改该文件，或在引入 `instance` 之前覆盖。

---

## 🧠 关键设计点

| 主题               | 实现                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| 鉴权               | `userContext` 持有 token；`AuthFetchHttpRequest` 自动加 `Authorization` |
| 路由守卫           | `AuthGuard` 组件；管理员访问 `/user` 自动重定向到 `/admin`           |
| 数据缓存           | TanStack Query 默认 staleTime，避免重复请求                          |
| 错误处理           | 自定义 `ApiResponse { code, message, data }`；`extractErrorMessage` 统一提示 |
| 弹窗统一           | `PopWindow` 基于 `createPortal` + Esc/外部点击关闭                   |
| 状态机可视化       | `Tag color` + `Segmented` 顶部筛选，状态颜色统一在 `contractSign.ts` |
| 实时通知           | `rentHouseManage` 在创建合同时通过 Socket 主动给房东发"租房申请"消息 |
| 主题               | Tailwind 4 + AntD Token 统一在 `global.css`，主色 `#f97316`（橙）    |

---

## 🧪 状态/颜色 常量参考

```ts
// personal/contractSign.ts
STATUS_TABS          = [全部, 待确认, 待签署, 已生效, 已终止]
STATUS_COLOR_MAP     = { pending_landlord: gold, pending_tenant: blue, active: green, terminated: default }
LEASE_TERM_OPTIONS   = [6, 12, 18, 24] 个月
SOCKET_URL           = "http://127.0.0.1:8000"
formatDate / formatDateTime
```

维修工单 / 投诉 / 租金 各自维护独立的 `STATUS_TABS` 与 `STATUS_COLOR_MAP`，集中在各自组件文件内。

---

## 📜 License

MIT
