from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Generic, TypeVar
from datetime import datetime, date
from enum import Enum

# ==================== 通用类型 ====================

T = TypeVar('T')

class PaginationParams(BaseModel):
    """分页请求参数"""
    page: int = Field(ge=1, description="当前页码（从1开始）")
    page_size: int = Field(ge=1, le=100, description="每页条数")

class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应"""
    total: int = Field(description="总条数")
    page: int = Field(description="当前页码")
    page_size: int = Field(description="每页条数")
    items: List[T] = Field(description="当前页数据")

class ApiResponse(BaseModel, Generic[T]):
    """通用响应"""
    code: int = Field(description="业务状态码：200成功，4xx客户端错误，5xx服务端错误")
    message: str = Field(description="提示信息")
    data: Optional[T] = Field(None, description="业务数据")

# ==================== 枚举定义 ====================

class UserRole(str, Enum):
    """用户角色"""
    LANDLORD = "landlord"
    TENANT = "tenant"
    ADMIN = "admin"

class HouseType(str, Enum):
    """房源类型"""
    APARTMENT = "apartment"
    RESIDENTIAL = "residential"
    VILLA = "villa"

class DecorationType(str, Enum):
    """装修类型"""
    LUXURY = "luxury"
    SIMPLE = "simple"
    ROUGH = "rough"

class HouseStatus(str, Enum):
    """房源状态"""
    VACANT = "vacant"
    RENTED = "rented"
    MAINTENANCE = "maintenance"

class ContractStatus(str, Enum):
    """合同状态"""
    PENDING_LANDLORD = "pending_landlord"
    PENDING_TENANT = "pending_tenant"
    ACTIVE = "active"
    TERMINATED = "terminated"

class RentStatus(str, Enum):
    """租金状态"""
    UNPAID = "unpaid"
    PAID = "paid"

class UrgencyLevel(str, Enum):
    """紧急程度"""
    NORMAL = "normal"
    URGENT = "urgent"

class RepairStatus(str, Enum):
    """维修状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"

class ComplaintType(str, Enum):
    """投诉类型"""
    HOUSE = "house"
    LANDLORD = "landlord"
    OTHER = "other"

class ComplaintStatus(str, Enum):
    """投诉状态"""
    PENDING = "pending"
    RESOLVED = "resolved"

# ==================== 用户模块 ====================

class User(BaseModel):
    """用户信息"""
    id: int
    role: UserRole
    email: str
    nickname: str
    phone: str = ""
    avatar: str = ""
    is_active: bool = True
    created_at: datetime

class RegisterRequest(BaseModel):
    """注册请求"""
    role: UserRole
    email: EmailStr
    password: str = Field(min_length=6, max_length=50)
    nickname: str = Field(min_length=1, max_length=50)

class LoginRequest(BaseModel):
    """登录请求"""
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    """登录响应"""
    token: str
    user: User

class UpdateProfileRequest(BaseModel):
    """更新个人信息请求"""
    nickname: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    avatar: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str
    new_password: str = Field(min_length=6, max_length=50)

class AdminResetPasswordRequest(BaseModel):
    """管理员重置密码请求"""
    user_id: int
    new_password: str = Field(min_length=6, max_length=50)

class RentalHistory(BaseModel):
    """租赁历史记录"""
    contract_id: int
    house_address: str
    house_layout: str
    start_date: str
    end_date: str
    monthly_rent: float
    status: str

# ==================== 房源模块 ====================

class House(BaseModel):
    """房源完整信息"""
    id: int
    landlord_id: int
    landlord_nickname: str
    address_province: str
    address_city: str
    address_district: str
    address_detail: str
    house_type: HouseType
    layout: str
    area: float
    monthly_rent: float
    deposit: float
    decoration: DecorationType
    facilities: List[str] = []
    description: str = ""
    images: List[str] = []
    status: HouseStatus
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

class HouseRequest(BaseModel):
    """发布/编辑房源请求"""
    address_province: str = Field(min_length=1, max_length=50)
    address_city: str = Field(min_length=1, max_length=50)
    address_district: str = Field(min_length=1, max_length=50)
    address_detail: str = Field(min_length=1, max_length=255)
    house_type: HouseType
    layout: str = Field(min_length=1, max_length=50)
    area: float = Field(gt=0)
    monthly_rent: float = Field(gt=0)
    deposit: float = Field(ge=0)
    decoration: DecorationType
    facilities: List[str] = []
    description: str = ""
    images: List[str] = []

class ImageUploadResponse(BaseModel):
    """图片上传响应"""
    urls: List[str]

class HouseListItem(BaseModel):
    """房源列表项（简化版）"""
    id: int
    cover_image: str = ""
    layout: str
    address_summary: str
    monthly_rent: float
    area: float
    status: HouseStatus
    status_label: str
    created_at: datetime

class UpdateHouseStatusRequest(BaseModel):
    """更新房源状态请求"""
    status: HouseStatus

# ==================== 搜索模块 ====================

class SearchParams(PaginationParams):
    """搜索请求参数"""
    keyword: Optional[str] = None
    layout: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    min_rent: Optional[float] = Field(None, ge=0)
    max_rent: Optional[float] = Field(None, ge=0)
    min_area: Optional[float] = Field(None, ge=0)
    max_area: Optional[float] = Field(None, ge=0)
    house_type: Optional[HouseType] = None
    decoration: Optional[DecorationType] = None

class SearchResult(BaseModel):
    """搜索结果"""
    total: int
    items: List[HouseListItem]

# ==================== 聊天模块 ====================

class ChatRoom(BaseModel):
    """聊天室"""
    id: int
    house_id: int
    house_info: str
    tenant_id: int
    landlord_id: int
    other_user_nickname: str
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    created_at: datetime

class ChatMessage(BaseModel):
    """聊天消息"""
    id: int
    room_id: int
    sender_id: int
    sender_nickname: str
    content: str
    created_at: datetime

class ChatHistoryResponse(BaseModel):
    """历史消息响应"""
    room_id: int
    messages: List[ChatMessage]
    total: int
    page: int
    page_size: int

class WSJoinPayload(BaseModel):
    """WebSocket加入房间"""
    room_id: int

class WSSendMessagePayload(BaseModel):
    """WebSocket发送消息"""
    room_id: int
    content: str

class WSReceiveMessagePayload(BaseModel):
    """WebSocket接收消息"""
    room_id: int
    message: ChatMessage

# ==================== 合同模块 ====================

class Contract(BaseModel):
    """合同信息"""
    id: int
    house_id: int
    tenant_id: int
    landlord_id: int
    house_address: str
    house_layout: str
    house_area: float
    tenant_nickname: str
    tenant_phone: str
    landlord_nickname: str
    landlord_phone: str
    start_date: str
    end_date: str
    monthly_rent: float
    deposit: float
    terms: str
    status: ContractStatus
    status_label: str
    created_at: datetime
    updated_at: datetime

class CreateContractRequest(BaseModel):
    """发起租赁请求"""
    house_id: int

class ConfirmContractRequest(BaseModel):
    """确认合同请求"""
    contract_id: int

# ==================== 租金模块 ====================

class RentRecord(BaseModel):
    """租金记录"""
    id: int
    contract_id: int
    month: str
    amount: float
    status: RentStatus
    status_label: str
    paid_at: Optional[datetime] = None

class ConfirmPaymentRequest(BaseModel):
    """确认付款请求"""
    rent_id: int

class RemindPaymentRequest(BaseModel):
    """提醒付款请求"""
    rent_id: int

# ==================== 维修模块 ====================

class RepairRequest(BaseModel):
    """提交维修申请"""
    house_id: int
    description: str = Field(min_length=1, max_length=1000)
    urgency: UrgencyLevel = UrgencyLevel.NORMAL

class RepairRecord(BaseModel):
    """维修工单"""
    id: int
    house_id: int
    house_address: str
    tenant_id: int
    tenant_nickname: str
    description: str
    urgency: UrgencyLevel
    urgency_label: str
    status: RepairStatus
    status_label: str
    created_at: datetime
    updated_at: datetime

class UpdateRepairStatusRequest(BaseModel):
    """更新维修状态"""
    status: RepairStatus

# ==================== 投诉模块 ====================

class ComplaintRequest(BaseModel):
    """提交投诉"""
    type: ComplaintType
    content: str = Field(min_length=1, max_length=2000)

class ComplaintRecord(BaseModel):
    """投诉记录"""
    id: int
    tenant_id: int
    tenant_nickname: str
    type: ComplaintType
    type_label: str
    content: str
    status: ComplaintStatus
    status_label: str
    admin_feedback: str = ""
    created_at: datetime
    updated_at: datetime

class HandleComplaintRequest(BaseModel):
    """处理投诉请求"""
    complaint_id: int
    feedback: str = Field(min_length=1, max_length=2000)

# ==================== 管理模块 ====================

class LogRecord(BaseModel):
    """日志记录"""
    id: int
    user_id: Optional[int] = None
    user_nickname: str = ""
    action: str
    ip_address: str = ""
    created_at: datetime

class LogQueryParams(PaginationParams):
    """日志查询参数"""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    user_id: Optional[int] = None
