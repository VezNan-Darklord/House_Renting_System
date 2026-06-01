import { Spin, Empty, Tag, Divider } from "antd";
import { useRepairDetailQuery } from "../../../api/hooks/repairHooks";
import { formatDateTime, formatDate } from "./contractSign";
import PopWindow from "../common/PopWindow";
import type { RepairStatus, UrgencyLevel } from "../../../api";

type RepairDetailModalProps = {
    repairId: number | null;
    onClose: () => void;
};

const STATUS_COLOR_MAP: Record<RepairStatus, string> = {
    pending: "gold",
    processing: "blue",
    completed: "green",
};

const URGENCY_COLOR_MAP: Record<UrgencyLevel, string> = {
    normal: "default",
    urgent: "red",
};

export default function RepairDetailPopWindow({ repairId, onClose }: RepairDetailModalProps) {
    const detailQuery = useRepairDetailQuery(repairId ?? undefined, repairId !== null);
    const repair = detailQuery.data?.data;

    return (
        <PopWindow open={repairId !== null} title="维修工单详情" onClose={onClose}>
            {detailQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Spin />
                </div>
            ) : !repair ? (
                <Empty description="未找到工单信息" />
            ) : (
                <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-base font-semibold text-slate-900">
                            {repair.house_address ?? "房源信息"}
                        </div>
                        <div className="flex items-center gap-1">
                            {repair.status ? (
                                <Tag color={STATUS_COLOR_MAP[repair.status]}>
                                    {repair.status_label ?? repair.status}
                                </Tag>
                            ) : null}
                            {repair.urgency ? (
                                <Tag color={URGENCY_COLOR_MAP[repair.urgency]}>
                                    {repair.urgency_label ??
                                        (repair.urgency === "urgent" ? "紧急" : "普通")}
                                </Tag>
                            ) : null}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">报修人</div>
                        <div className="mt-1 font-medium text-slate-800">
                            {repair.tenant_nickname ?? "--"}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">故障描述</div>
                        <pre className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            {repair.description || "暂无描述"}
                        </pre>
                    </div>
                    <Divider className="my-2! border-slate-200!" />
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                        <div>
                            <div className="text-slate-400">创建时间</div>
                            <div className="mt-1 text-slate-700">
                                {formatDateTime(repair.created_at)}
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-400">更新时间</div>
                            <div className="mt-1 text-slate-700">
                                {formatDate(repair.updated_at)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PopWindow>
    );
}