import type { ContractStatus } from "../../../api/models/ContractStatus";

export const SOCKET_URL = "http://127.0.0.1:8000";

export const STATUS_TABS: { label: string; value: ContractStatus | "all" }[] = [
    { label: "全部", value: "all" },
    { label: "待确认", value: "pending_landlord" },
    { label: "待签署", value: "pending_tenant" },
    { label: "已生效", value: "active" },
    { label: "已终止", value: "terminated" },
];

export const STATUS_COLOR_MAP: Record<ContractStatus, string> = {
    pending_landlord: "gold",
    pending_tenant: "blue",
    active: "green",
    terminated: "default",
};

export const LEASE_TERM_OPTIONS = [
    { label: "6 个月", value: 6 },
    { label: "12 个月", value: 12 },
    { label: "18 个月", value: 18 },
    { label: "24 个月", value: 24 },
];

export const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("zh-CN");
};

export const formatDateTime = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("zh-CN", { hour12: false });
};