# 智能房屋租赁系统实现文档

**版本**：V1.2  
**技术栈**：前端 React + TypeScript + OpenAPI（接口同步）+ React Query（HTTP请求）+ 后端 Flask (Python) + MySQL + WebSocket  
**文档用途**：前后端协作开发参考，可直接复制使用

---

## 一、TypeScript 接口定义

```typescript
// ==================== 通用类型 ====================

// 分页请求参数
interface PaginationParams {
  /** 当前页码（建议从 1 开始） */
  page: number;
  /** 每页条数 */
  page_size: number;
}

// 分页响应
interface PaginatedResponse<T> {
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  page_size: number;
  /** 当前页数据 */
  items: T[];
}

// 通用响应
interface ApiResponse<T = null> {
  /** 业务状态码：200成功，4xx客户端错误，5xx服务端错误 */
  code: number;
  /** 提示信息（用于toast/弹窗/日志） */
  message: string;
  /** 业务数据（失败时可能为 null 或空对象，按后端约定） */
  data: T;
}

// ==================== 用户模块 ====================

type UserRole = 'landlord' | 'tenant' | 'admin';

interface User {
  /** 用户ID */
  id: number;
  /** 用户角色：房东/租客/管理员 */
  role: UserRole;
  /** 登录邮箱（唯一） */
  email: string;
  /** 昵称（展示用） */
  nickname: string;
  /** 手机号（可为空字符串） */
  phone: string;
  /** 头像URL（可为空字符串） */
  avatar: string;
  /** 账号是否启用（管理员可禁用） */
  is_active: boolean;
  /** 创建时间（ISO 8601 或后端统一时间字符串） */
  created_at: string;
}

// 注册请求
interface RegisterRequest {
  /** 注册角色 */
  role: UserRole;
  /** 邮箱 */
  email: string;
  /** 明文密码（仅传输，后端需哈希存储） */
  password: string;
  /** 昵称 */
  nickname: string;
}

// 登录请求
interface LoginRequest {
  /** 邮箱 */
  email: string;
  /** 明文密码 */
  password: string;
}

// 登录响应
interface LoginResponse {
  /** JWT Token（建议放在 Authorization: Bearer <token>） */
  token: string;
  /** 当前登录用户信息 */
  user: User;
}

// 更新个人信息请求
interface UpdateProfileRequest {
  /** 昵称（不传则不修改） */
  nickname?: string;
  /** 手机号（不传则不修改） */
  phone?: string;
  /** 头像URL（不传则不修改） */
  avatar?: string;
}

// 修改密码请求
interface ChangePasswordRequest {
  /** 旧密码 */
  old_password: string;
  /** 新密码 */
  new_password: string;
}

// 管理员重置密码请求
interface ResetPasswordRequest {
  /** 目标用户ID */
  user_id: number;
  /** 新密码（管理员设置） */
  new_password: string;
}

// 租赁历史记录
interface RentalHistory {
  /** 合同ID */
  contract_id: number;
  /** 房源地址（快照/展示用） */
  house_address: string;
  /** 房源户型（快照/展示用） */
  house_layout: string;
  /** 租期开始日期（YYYY-MM-DD） */
  start_date: string;
  /** 租期结束日期（YYYY-MM-DD） */
  end_date: string;
  /** 月租金 */
  monthly_rent: number;
  /** 合同状态（字符串/枚举值，按后端约定） */
  status: string;
}

// ==================== 房源模块 ====================

type HouseType = 'apartment' | 'residential' | 'villa';
type DecorationType = 'luxury' | 'simple' | 'rough';
type HouseStatus = 'vacant' | 'rented' | 'maintenance';

interface House {
  /** 房源ID */
  id: number;
  /** 房东用户ID */
  landlord_id: number;
  /** 房东昵称（展示用，便于列表/详情直出） */
  landlord_nickname: string;
  /** 省 */
  address_province: string;
  /** 市 */
  address_city: string;
  /** 区/县 */
  address_district: string;
  /** 详细地址（街道/小区/门牌） */
  address_detail: string;
  /** 房源类型 */
  house_type: HouseType;
  /** 户型（例如："2室1厅1卫"） */
  layout: string;
  /** 面积（平方米） */
  area: number;
  /** 月租金 */
  monthly_rent: number;
  /** 押金 */
  deposit: number;
  /** 装修类型 */
  decoration: DecorationType;
  /** 配套设施（字符串数组，例如："空调"、"冰箱"） */
  facilities: string[];
  /** 房源描述 */
  description: string;
  /** 图片URL数组 */
  images: string[];
  /** 房源状态 */
  status: HouseStatus;
  /** 是否软删除 */
  is_deleted: boolean;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

// 发布/编辑房源请求
interface HouseRequest {
  /** 省 */
  address_province: string;
  /** 市 */
  address_city: string;
  /** 区/县 */
  address_district: string;
  /** 详细地址 */
  address_detail: string;
  /** 房源类型 */
  house_type: HouseType;
  /** 户型 */
  layout: string;
  /** 面积（平方米） */
  area: number;
  /** 月租金 */
  monthly_rent: number;
  /** 押金 */
  deposit: number;
  /** 装修类型 */
  decoration: DecorationType;
  /** 配套设施 */
  facilities: string[];
  /** 房源描述 */
  description: string;
  /** 图片通过单独的图片上传接口处理（此处不直接提交 images） */
}

// 图片上传响应
interface ImageUploadResponse {
  /** 上传成功后的图片URL数组 */
  urls: string[];
}

// 房源列表项（简化版）
interface HouseListItem {
  /** 房源ID */
  id: number;
  /** 封面图URL */
  cover_image: string;
  /** 户型 */
  layout: string;
  /** 地址摘要（例如："长沙市岳麓区xxx小区"） */
  address_summary: string;
  /** 月租金 */
  monthly_rent: number;
  /** 面积（平方米） */
  area: number;
  /** 房源状态 */
  status: HouseStatus;
  /** 状态中文标签（用于UI直接展示） */
  status_label: string;
  /** 发布时间 */
  created_at: string;
}

// 更新房源状态请求
interface UpdateHouseStatusRequest {
  /** 目标状态 */
  status: HouseStatus;
}

// ==================== 搜索模块 ====================

// 搜索请求参数
interface SearchParams extends PaginationParams {
  /** 关键词（通常匹配省市区/小区/详细地址等） */
  keyword?: string;
  /** 户型关键词（可模糊匹配 layout 字段） */
  layout?: string;
  /** 省（精确匹配） */
  province?: string;
  /** 市（精确匹配） */
  city?: string;
  /** 区/县（精确匹配） */
  district?: string;
  /** 最低租金 */
  min_rent?: number;
  /** 最高租金 */
  max_rent?: number;
  /** 最小面积 */
  min_area?: number;
  /** 最大面积 */
  max_area?: number;
  /** 房源类型 */
  house_type?: HouseType;
  /** 装修类型 */
  decoration?: DecorationType;
}

// 搜索结果
interface SearchResult {
  /** 总条数 */
  total: number;
  /** 列表数据 */
  items: HouseListItem[];
}

// ==================== 聊天模块 ====================

interface ChatRoom {
  /** 聊天室ID */
  id: number;
  /** 关联房源ID */
  house_id: number;
  /** 房源摘要信息（用于会话列表展示） */
  house_info: string;
  /** 租客ID */
  tenant_id: number;
  /** 房东ID */
  landlord_id: number;
  /** 会话列表里“对方”的昵称 */
  other_user_nickname: string;
  /** 最后一条消息内容（可选：无消息时为空） */
  last_message?: string;
  /** 最后一条消息时间（可选） */
  last_message_time?: string;
  /** 房间创建时间 */
  created_at: string;
}

interface ChatMessage {
  /** 消息ID */
  id: number;
  /** 房间ID */
  room_id: number;
  /** 发送者用户ID */
  sender_id: number;
  /** 发送者昵称 */
  sender_nickname: string;
  /** 消息文本内容 */
  content: string;
  /** 发送时间 */
  created_at: string;
}

// HTTP获取历史消息响应
interface ChatHistoryResponse {
  /** 房间ID */
  room_id: number;
  /** 消息列表（按时间正序） */
  messages: ChatMessage[];
  /** 总消息条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  page_size: number;
}

// WebSocket 事件载荷

// 客户端 -> 服务端：加入房间
interface WSJoinPayload {
  /** 要加入的房间ID */
  room_id: number;
}

// 客户端 -> 服务端：发送消息
interface WSSendMessagePayload {
  /** 房间ID */
  room_id: number;
  /** 消息文本 */
  content: string;
}

// 服务端 -> 客户端：接收消息
interface WSReceiveMessagePayload {
  /** 房间ID */
  room_id: number;
  /** 新消息对象 */
  message: ChatMessage;
}

// WebSocket事件枚举
type WSEvent = 'join' | 'send_message' | 'receive_message' | 'leave' | 'error';

interface WSMessage {
  /** 事件名 */
  event: WSEvent;
  /** 事件载荷（按 event 对应不同结构） */
  payload:
    | WSJoinPayload
    | WSSendMessagePayload
    | WSReceiveMessagePayload
    | { message: string };
}

// ==================== 合同模块 ====================

type ContractStatus = 'pending_landlord' | 'pending_tenant' | 'active' | 'terminated';

interface Contract {
  /** 合同ID */
  id: number;
  /** 房源ID */
  house_id: number;
  /** 租客ID */
  tenant_id: number;
  /** 房东ID */
  landlord_id: number;
  /** 房源地址快照（合同生成时固定，用于防止房源信息变动影响合同） */
  house_address: string;
  /** 房源户型快照 */
  house_layout: string;
  /** 房源面积快照（平方米） */
  house_area: number;
  /** 租客昵称（合同展示用） */
  tenant_nickname: string;
  /** 租客联系电话 */
  tenant_phone: string;
  /** 房东昵称（合同展示用） */
  landlord_nickname: string;
  /** 房东联系电话 */
  landlord_phone: string;
  /** 租期开始日期（YYYY-MM-DD） */
  start_date: string;
  /** 租期结束日期（YYYY-MM-DD） */
  end_date: string;
  /** 月租金 */
  monthly_rent: number;
  /** 押金 */
  deposit: number;
  /** 合同固定条款文本（后端模板生成/存档） */
  terms: string;
  /** 合同状态 */
  status: ContractStatus;
  /** 合同状态中文标签（用于UI直接展示） */
  status_label: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

// 租客发起租赁请求（生成合同）
interface CreateContractRequest {
  /** 目标房源ID */
  house_id: number;
}

// 房东确认合同
interface ConfirmContractRequest {
  /** 合同ID */
  contract_id: number;
}

// ==================== 租金模块 ====================

type RentStatus = 'unpaid' | 'paid';

interface RentRecord {
  /** 租金记录ID */
  id: number;
  /** 合同ID */
  contract_id: number;
  /** 租金月份（YYYY-MM，例如："2026-01"） */
  month: string;
  /** 金额 */
  amount: number;
  /** 支付状态 */
  status: RentStatus;
  /** 状态中文标签 */
  status_label: string;
  /** 付款时间（未付款为 null） */
  paid_at: string | null;
}

// 租客确认付款
interface ConfirmPaymentRequest {
  /** 租金记录ID */
  rent_id: number;
}

// 房东提醒
interface RemindRequest {
  /** 租金记录ID */
  rent_id: number;
}

// ==================== 维修模块 ====================

type UrgencyLevel = 'normal' | 'urgent';
type RepairStatus = 'pending' | 'processing' | 'completed';

interface RepairRequest {
  /** 房源ID */
  house_id: number;
  /** 问题描述 */
  description: string;
  /** 紧急程度 */
  urgency: UrgencyLevel;
}

interface RepairRecord {
  /** 工单ID */
  id: number;
  /** 房源ID */
  house_id: number;
  /** 房源地址（展示用） */
  house_address: string;
  /** 租客ID */
  tenant_id: number;
  /** 租客昵称 */
  tenant_nickname: string;
  /** 报修描述 */
  description: string;
  /** 紧急程度 */
  urgency: UrgencyLevel;
  /** 紧急程度中文标签 */
  urgency_label: string;
  /** 工单状态 */
  status: RepairStatus;
  /** 工单状态中文标签 */
  status_label: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

// 房东更新维修状态
interface UpdateRepairStatusRequest {
  /** 目标状态 */
  status: RepairStatus;
}

// ==================== 投诉模块 ====================

type ComplaintType = 'house' | 'landlord' | 'other';
type ComplaintStatus = 'pending' | 'resolved';

interface ComplaintRequest {
  /** 投诉类型 */
  type: ComplaintType;
  /** 投诉内容 */
  content: string;
}

interface ComplaintRecord {
  /** 投诉ID */
  id: number;
  /** 租客ID */
  tenant_id: number;
  /** 租客昵称 */
  tenant_nickname: string;
  /** 投诉类型 */
  type: ComplaintType;
  /** 投诉类型中文标签 */
  type_label: string;
  /** 投诉内容 */
  content: string;
  /** 处理状态 */
  status: ComplaintStatus;
  /** 状态中文标签 */
  status_label: string;
  /** 管理员反馈（未处理可为空字符串） */
  admin_feedback: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

// 管理员处理投诉
interface HandleComplaintRequest {
  /** 投诉ID */
  complaint_id: number;
  /** 管理员处理反馈 */
  feedback: string;
}

// ==================== 管理模块 ====================

interface LogRecord {
  /** 日志ID */
  id: number;
  /** 用户ID（可能为空/0，按后端记录策略） */
  user_id: number;
  /** 用户昵称（展示用） */
  user_nickname: string;
  /** 行为描述（例如："login"、"publish_house"） */
  action: string;
  /** 操作来源IP */
  ip_address: string;
  /** 记录时间 */
  created_at: string;
}

// 日志查询参数
interface LogQueryParams extends PaginationParams {
  /** 起始日期（YYYY-MM-DD） */
  start_date?: string;
  /** 结束日期（YYYY-MM-DD） */
  end_date?: string;
  /** 按用户ID过滤 */
  user_id?: number;
}
```

---

## 二、后端（Flask + Python）实现任务

### 项目结构建议

```
backend/
├── app.py                  # 应用入口
├── config.py               # 配置文件
├── requirements.txt        # 依赖
├── models/                 # 数据库模型
│   ├── __init__.py
│   ├── user.py
│   ├── house.py
│   ├── chat.py
│   ├── contract.py
│   └── ...
├── routes/                 # 路由蓝图
│   ├── __init__.py
│   ├── auth.py
│   ├── user.py
│   ├── house.py
│   ├── search.py
│   ├── chat.py
│   ├── contract.py
│   ├── rent.py
│   ├── repair.py
│   ├── complaint.py
│   └── admin.py
├── services/               # 业务逻辑层
│   └── ...
├── utils/                  # 工具函数
│   ├── auth.py             # JWT工具
│   ├── response.py         # 统一响应格式
│   └── validators.py       # 参数校验
├── socketio_handler.py     # WebSocket处理
├── seed_data.py            # 种子数据脚本
└── uploads/                # 图片上传目录
```

### 各模块后端任务

#### 1. 用户认证模块 (`routes/auth.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 注册 | `/api/auth/register` | POST | 校验字段，密码哈希，写入数据库，返回成功 |
| 登录 | `/api/auth/login` | POST | 查询用户，验证密码，生成JWT，返回token和用户信息 |

- JWT生成使用 `pyjwt`，token中包含 `user_id` 和 `role`
- 密码使用 `werkzeug.security.generate_password_hash` / `check_password_hash`

#### 2. 用户模块 (`routes/user.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 获取个人信息 | `/api/users/profile` | GET | 从JWT解析user_id，返回用户信息 |
| 更新个人信息 | `/api/users/profile` | PUT | 更新nickname/phone/avatar |
| 修改密码 | `/api/users/password` | PUT | 验证旧密码，更新新密码 |
| 获取租赁历史 | `/api/users/rental-history` | GET | 查询该用户关联的已生效合同列表 |

#### 3. 房源模块 (`routes/house.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 发布房源 | `/api/houses` | POST | 房东权限，写入房源数据，状态默认vacant |
| 获取我的房源 | `/api/houses/my` | GET | 房东查看自己发布的房源列表 |
| 编辑房源 | `/api/houses/<id>` | PUT | 仅本人可编辑 |
| 删除房源 | `/api/houses/<id>` | DELETE | 软删除，检查是否有有效合同 |
| 更新房源状态 | `/api/houses/<id>/status` | PUT | 手动变更状态 |
| 上传图片 | `/api/houses/upload-image` | POST | 接收图片文件，保存到uploads/，返回URL数组 |
| 公开房源列表 | `/api/houses` | GET | 无需登录，分页返回已发布且未删除的房源 |
| 房源详情 | `/api/houses/<id>` | GET | 返回完整房源信息+房东基本信息 |

- 图片上传使用 Flask 的 `request.files`，存储路径存数据库
- 公开列表过滤 `is_deleted=0` 且 `status != 'maintenance'`（维修中的可选择性展示）

#### 4. 搜索模块 (`routes/search.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 搜索房源 | `/api/search` | GET | 接收查询参数，拼接SQL条件，分页返回 |

- 模糊匹配：`LIKE '%keyword%'`
- 范围查询：`BETWEEN min AND max`
- 结果按 `created_at DESC` 排序

#### 5. 聊天模块 (`socketio_handler.py` + `routes/chat.py`)

**WebSocket部分（使用 Flask-SocketIO）**

| 任务 | 事件 | 说明 |
|------|------|------|
| 建立连接 | `connect` | 验证JWT，记录用户在线状态 |
| 加入房间 | `join` | 接收room_id，使用 `join_room(room_id)` |
| 发送消息 | `send_message` | 存储消息到数据库，使用 `emit('receive_message', ...)` 广播给房间 |
| 离开房间 | `leave` | 使用 `leave_room(room_id)` |
| 断开连接 | `disconnect` | 清理在线状态 |

**HTTP接口**

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 获取聊天室列表 | `/api/chat/rooms` | GET | 返回当前用户参与的所有聊天室 |
| 获取历史消息 | `/api/chat/history/<room_id>` | GET | 分页返回，按时间正序 |
| 创建/获取聊天室 | `/api/chat/rooms` | POST | 参数house_id，自动创建或返回已有房间 |

#### 6. 合同模块 (`routes/contract.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 发起租赁 | `/api/contracts` | POST | 租客发起，参数house_id，生成合同，状态pending_landlord |
| 获取我的合同 | `/api/contracts/my` | GET | 根据角色返回相关合同列表 |
| 房东确认 | `/api/contracts/<id>/confirm` | PUT | 房东操作，状态变为pending_tenant |
| 租客签署 | `/api/contracts/<id>/sign` | PUT | 租客操作，状态变为active，房源状态自动变为rented，生成租金记录 |
| 合同详情 | `/api/contracts/<id>` | GET | 返回合同完整信息 |

- 合同模板固定在代码中，作为 `terms` 字段内容
- 签署成功后需用事务：更新合同状态 + 更新房源状态 + 生成租金记录

#### 7. 租金模块 (`routes/rent.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 获取我的租金 | `/api/rents/my` | GET | 租客看自己的，房东看名下房源的 |
| 确认已付 | `/api/rents/<id>/pay` | PUT | 租客操作，状态变paid，记录paid_at时间 |
| 房东提醒 | `/api/rents/<id>/remind` | POST | 通过聊天室发系统消息 |

- 租金记录在合同生效时自动生成（每月一条）
- "提醒"功能复用聊天模块，插入一条系统消息

#### 8. 维修模块 (`routes/repair.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 提交维修申请 | `/api/repairs` | POST | 租客操作 |
| 获取维修列表 | `/api/repairs/my` | GET | 租客看自己的，房东看名下房源相关 |
| 更新维修状态 | `/api/repairs/<id>/status` | PUT | 房东操作 |

#### 9. 投诉模块 (`routes/complaint.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 提交投诉 | `/api/complaints` | POST | 租客操作 |
| 获取我的投诉 | `/api/complaints/my` | GET | 租客查看自己提交的 |
| 获取所有投诉 | `/api/complaints` | GET | 管理员查看全部 |
| 处理投诉 | `/api/complaints/<id>/handle` | PUT | 管理员填写反馈，状态变resolved |

#### 10. 管理模块 (`routes/admin.py`)

| 任务 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 用户列表 | `/api/admin/users` | GET | 分页，可按角色筛选 |
| 禁用/启用用户 | `/api/admin/users/<id>/toggle` | PUT | 切换is_active |
| 重置密码 | `/api/admin/users/<id>/reset-password` | PUT | 重置为默认密码 |
| 系统日志 | `/api/admin/logs` | GET | 分页，可按时间筛选 |

#### 11. 权限中间件 (`utils/auth.py`)

- 装饰器 `@login_required`：从Header获取Token，解析验证，将user信息注入request
- 装饰器 `@role_required(roles)`：检查当前用户角色是否在允许列表中
- Token过期处理：返回401状态码

---

## 三、前端（React + TypeScript）实现任务

### 项目结构建议

```
frontend/
├── src/
│   ├── api/
│   │   ├── generated/          # OpenAPI 自动生成（禁止手改）
│   │   └── client.ts           # 基础请求封装：fetch + baseUrl + token + 统一错误
│   ├── queries/                # React Query：按模块组织 query/mutation hooks
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── house.ts
│   │   ├── search.ts
│   │   ├── chat.ts
│   │   ├── contract.ts
│   │   ├── rent.ts
│   │   ├── repair.ts
│   │   ├── complaint.ts
│   │   └── admin.ts
│   ├── components/             # 公共组件
│   │   ├── Layout/
│   │   ├── AuthRoute.tsx       # 路由守卫
│   │   ├── ImageUpload.tsx     # 图片上传组件
│   │   ├── Pagination.tsx      # 分页组件
│   │   └── Modal.tsx           # 弹窗组件
│   ├── websocket/              # 实时通信封装（聊天）
│   │   └── useChatSocket.ts    # 连接/加入房间/收发消息
│   ├── pages/                  # 页面组件
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Home/
│   │   ├── HouseDetail/
│   │   ├── HouseManage/        # 房东房源管理
│   │   ├── PublishHouse/       # 发布房源
│   │   ├── EditHouse/          # 编辑房源
│   │   ├── Messages/           # 聊天列表+聊天窗口
│   │   ├── MyContracts/
│   │   ├── MyRents/
│   │   ├── MyRepairs/
│   │   ├── MyComplaints/
│   │   ├── Profile/
│   │   └── Admin/              # 管理后台
│   ├── hooks/                  # UI层通用hooks（不放网络请求）
│   │   ├── useAuth.ts
│   │   └── usePagination.ts
│   ├── types/                  # 仅放“前端独有类型”；接口类型优先来自 OpenAPI generated
│   │   └── index.ts
│   ├── utils/
│   │   └── token.ts            # token存取工具
│   ├── App.tsx
│   └── main.tsx
```

### OpenAPI + React Query 约定（推荐）

- 接口类型与请求函数：只来自 `src/api/generated/`（由 OpenAPI 自动生成），业务代码禁止复制/手写接口类型，避免前后端漂移。
- HTTP 数据流：页面组件不直接 `fetch`；统一通过 `src/queries/*` 暴露的 `useQuery/useMutation` 使用接口。
- 鉴权与错误：`src/api/client.ts` 统一附加 token、统一解析 `ApiResponse`；当遇到401（或后端约定的未登录 code）时清理 token 并跳转登录。

> 说明：OpenAPI 的“生成工具/脚本”可按团队习惯选择；文档只约束产物目录与使用方式，不绑定具体实现。

### 各模块前端任务

#### 1. 基础配置

| 任务 | 说明 |
|------|------|
| OpenAPI 同步 | 后端提供 OpenAPI 文档（openapi.json/yaml），前端生成 `src/api/generated/`，禁止手写/复制接口类型 |
| React Query 初始化 | 在 `main.tsx` 注入 `QueryClientProvider`；统一配置重试、缓存时间、全局错误处理（401跳转登录） |
| 基础请求封装 | `src/api/client.ts` 使用 `fetch`：拼接 baseURL、自动附加 `Authorization`、统一解析 `ApiResponse`、遇到401清token并跳转 |
| Token管理 | 登录后存 localStorage，登出时清除；HTTP请求与Socket连接都从同一处读取token |
| 路由配置 | React Router，定义所有页面路由 |
| 路由守卫 | AuthRoute组件，未登录跳转/login，角色不符提示无权限 |

#### 2. 登录注册页 (`pages/Login`, `pages/Register`)

| 任务 | 说明 |
|------|------|
| 登录表单 | 邮箱+密码，表单校验，调用登录接口，存储token，跳转首页 |
| 注册表单 | 选择角色、邮箱、密码、昵称，表单校验，调用注册接口，成功后跳转登录 |
| 状态处理 | loading状态、错误提示 |

#### 3. 首页/房源列表 (`pages/Home`)

| 任务 | 说明 |
|------|------|
| 搜索栏 | 地区关键词输入、户型输入、租金范围、面积范围、装修/类型筛选 |
| 房源卡片列表 | 封面图、户型、地址摘要、月租金、面积、状态标签 |
| 分页 | 底部页码或滚动加载更多 |
| 点击卡片跳转详情页 |

#### 4. 房源详情页 (`pages/HouseDetail`)

| 任务 | 说明 |
|------|------|
| 图片展示 | 基于原生滚动/简单轮播实现即可（不引入额外UI库） |
| 信息展示 | 全部字段展示，房东信息 |
| 操作按钮 | 租客：「联系房东」（进入聊天）、「立即租赁」（生成合同） |
| 房东看自己的房源 | 显示「编辑」「删除」按钮 |

#### 5. 房源管理（房东）(`pages/HouseManage`, `pages/PublishHouse`, `pages/EditHouse`)

| 任务 | 说明 |
|------|------|
| 房源列表 | 表格或卡片形式，显示状态，操作按钮 |
| 发布房源 | 表单：省市区级联（可用模拟数据）、各字段输入、图片上传 |
| 编辑房源 | 复用发布表单，预填已有数据 |
| 删除房源 | 二次确认弹窗 |
| 状态切换 | 下拉选择切换（空置/维修中） |
| 图片上传 | 多图上传，预览，删除 |

#### 6. 聊天模块 (`pages/Messages`)

| 任务 | 说明 |
|------|------|
| 聊天室列表 | 左侧会话列表：对方昵称、房源信息、最后消息预览 |
| 聊天窗口 | 右侧消息列表（气泡样式）、输入框、发送按钮 |
| WebSocket连接 | 进入页面建立连接，监听从列表进入→加入房间 |
| 发送消息 | 输入文本，回车或点击发送，通过WebSocket发送 |
| 接收消息 | 监听receive_message事件，追加到消息列表 |
| 历史消息 | 进入房间时用 React Query 拉取最近50条，上滑加载更多（分页参数复用接口定义） |
| 自动滚动 | 新消息到达自动滚动到底部 |

**自定义Hook建议**：
```typescript
// websocket/useChatSocket.ts
function useChatSocket(roomId: number | null) {
  // 管理连接、加入/离开房间、收发消息（与后端 Flask-SocketIO 协议保持一致）
  // 返回: messages, sendMessage, isConnected
}
```

#### 7. 合同模块 (`pages/MyContracts`)

| 任务 | 说明 |
|------|------|
| 租客合同列表 | 显示合同状态标签（待房东确认/待签署/已生效） |
| 房东合同列表 | 显示待确认合同，「确认发起」按钮 |
| 合同详情 | 展示合同全部内容（标准模板+自动填充信息） |
| 租客签署 | 「同意并签署」按钮，弹窗二次确认 |
| 发起租赁 | 在房源详情页点击，调用接口，提示成功 |

#### 8. 租金模块 (`pages/MyRents`)

| 任务 | 说明 |
|------|------|
| 租客租金列表 | 显示月份、金额、状态（未付/已付） |
| 确认付款弹窗 | 点击未付记录，弹窗："确认已线下支付本月租金？"，确认后调接口 |
| 房东租金查看 | 按租客/房源查看租金缴纳情况 |
| 房东提醒 | 点击未付记录旁的「提醒」按钮，调接口 |

#### 9. 维修模块 (`pages/MyRepairs`)

| 任务 | 说明 |
|------|------|
| 租客提交申请 | 表单：选择关联房源、问题描述、紧急程度 |
| 租客查看列表 | 状态标签、时间线 |
| 房东查看列表 | 名下房源的所有维修申请 |
| 房东处理 | 下拉切换状态（待处理→处理中→已完成） |

#### 10. 投诉模块 (`pages/MyComplaints`)

| 任务 | 说明 |
|------|------|
| 租客提交投诉 | 表单：选择类型、填写内容 |
| 租客查看列表 | 状态、管理员反馈 |
| 管理员投诉列表 | 所有投诉，分页 |
| 管理员处理 | 填写反馈，状态变为已处理 |

#### 11. 个人中心 (`pages/Profile`)

| 任务 | 说明 |
|------|------|
| 查看/编辑个人信息 | 表单：昵称、手机号 |
| 修改密码 | 旧密码+新密码+确认新密码 |
| 租赁历史 | 列表展示历史合同 |

#### 12. 管理后台 (`pages/Admin`)

| 任务 | 说明 |
|------|------|
| 用户列表 | 表格：昵称、角色、状态、操作（禁用/启用、重置密码） |
| 系统日志 | 表格：用户、操作、IP、时间，支持时间范围筛选 |

---

## 四、数据库建表SQL参考

```sql
-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role ENUM('landlord', 'tenant', 'admin') NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    avatar VARCHAR(255) DEFAULT '',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 房源表
CREATE TABLE houses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    landlord_id INT NOT NULL,
    address_province VARCHAR(50) NOT NULL,
    address_city VARCHAR(50) NOT NULL,
    address_district VARCHAR(50) NOT NULL,
    address_detail VARCHAR(255) NOT NULL,
    house_type ENUM('apartment', 'residential', 'villa') NOT NULL,
    layout VARCHAR(50) NOT NULL,
    area DECIMAL(8,2) NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    decoration ENUM('luxury', 'simple', 'rough') NOT NULL,
    facilities JSON,
    description TEXT,
    images JSON,
    status ENUM('vacant', 'rented', 'maintenance') DEFAULT 'vacant',
    is_deleted TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (landlord_id) REFERENCES users(id)
);

-- 聊天室表
CREATE TABLE chat_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    house_id INT NOT NULL,
    tenant_id INT NOT NULL,
    landlord_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id),
    FOREIGN KEY (tenant_id) REFERENCES users(id),
    FOREIGN KEY (landlord_id) REFERENCES users(id),
    UNIQUE KEY unique_room (house_id, tenant_id, landlord_id)
);

-- 消息表
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 合同表
CREATE TABLE contracts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    house_id INT NOT NULL,
    tenant_id INT NOT NULL,
    landlord_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    terms TEXT NOT NULL,
    status ENUM('pending_landlord', 'pending_tenant', 'active', 'terminated') DEFAULT 'pending_landlord',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id),
    FOREIGN KEY (tenant_id) REFERENCES users(id),
    FOREIGN KEY (landlord_id) REFERENCES users(id)
);

-- 租金记录表
CREATE TABLE rent_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contract_id INT NOT NULL,
    month VARCHAR(7) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
    paid_at DATETIME NULL,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- 维修工单表
CREATE TABLE repairs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    house_id INT NOT NULL,
    tenant_id INT NOT NULL,
    description TEXT NOT NULL,
    urgency ENUM('normal', 'urgent') DEFAULT 'normal',
    status ENUM('pending', 'processing', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id),
    FOREIGN KEY (tenant_id) REFERENCES users(id)
);

-- 投诉表
CREATE TABLE complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    type ENUM('house', 'landlord', 'other') NOT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    admin_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES users(id)
);

-- 系统日志表
CREATE TABLE logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 五、开发顺序建议

建议按以下顺序迭代开发，逐步集成测试：

| 阶段 | 内容 | 说明 |
|------|------|------|
| **第1步** | 项目初始化 + 数据库建表 + 种子数据 | 前后端项目脚手架搭建，插入测试用户和房源数据 |
| **第2步** | 用户认证（注册/登录） + JWT | 先打通前后端鉴权流程 |
| **第3步** | 房源模块（发布/列表/详情/搜索） | 核心展示功能 |
| **第4步** | 聊天模块（WebSocket） | 核心沟通功能，技术难点，建议提前验证 |
| **第5步** | 合同模块 + 租金模块 | 租赁闭环 |
| **第6步** | 维修 + 投诉模块 | 辅助功能 |
| **第7步** | 管理后台 + 日志 | 管理员功能 |
| **第8步** | 个人中心 + 租赁历史 + 联调优化 | 收尾完善 |
