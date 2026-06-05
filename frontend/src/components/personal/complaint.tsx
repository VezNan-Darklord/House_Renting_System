import { useMemo, useState } from "react";
import {
    Button,
    Divider,
    Empty,
    Segmented,
    Spin,
    Tag,
} from "antd";
import {
    FileTextOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import {
    useComplaintListQuery,
} from "../../../api/hooks/complaintHooks";
import type { ComplaintRecord, ComplaintStatus, ComplaintType } from "../../../api";
import PopWindow from "../common/PopWindow";
import { formatDateTime } from "./contractSign";
import ComplaintPopWindow from "./complaintPopWindow";



const STATUS_TABS: { label: string; value: ComplaintStatus | "all" }[] = [
    { label: "全部", value: "all" },
    { label: "待处理", value: "pending" },
    { label: "已处理", value: "resolved" },
];

const STATUS_COLOR_MAP: Record<ComplaintStatus, string> = {
    pending: "gold",
    resolved: "green",
};

const COMPLAINT_TYPE_OPTIONS: { label: string; value: ComplaintType }[] = [
    { label: "房源问题", value: "house" },
    { label: "房东问题", value: "landlord" },
    { label: "其他问题", value: "other" },
];

const COMPLAINT_TYPE_COLOR_MAP: Record<ComplaintType, string> = {
    house: "blue",
    landlord: "volcano",
    other: "default",
};

type ComplaintTabValue = ComplaintStatus | "all";


type ComplaintHeaderProps = {
    onCreate: () => void;
    displayCreate: boolean;
};

function ComplaintHeader({ onCreate, displayCreate }: ComplaintHeaderProps) {
    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                        Complaint
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">我的投诉</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        提交投诉后管理员将进行处理，处理完成后您可以在此查看反馈结果。
                    </p>
                </div>
                {displayCreate && (
                    <Button
                        type="primary"
                        size="large"
                        shape="round"
                        icon={<PlusOutlined />}
                        className="bg-orange-500! font-semibold! shadow-none!"
                        onClick={onCreate}
                    >
                        提交投诉
                    </Button>
                )}
                </div>
        </section>
    );
}

type ComplaintCardProps = {
    complaint: ComplaintRecord;
    onView: (id: number) => void;
};

function ComplaintCard({ complaint, onView }: ComplaintCardProps) {
    const status = complaint.status;
    const type = complaint.type;
    const id = complaint.id;

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200 hover:bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="text-base font-semibold text-slate-900">
                    {complaint.type_label ??
                        COMPLAINT_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ??
                        "投诉"}
                </div>
                <div className="flex flex-col items-end gap-1">
                    {status ? (
                        <Tag color={STATUS_COLOR_MAP[status]}>
                            {complaint.status_label ?? status}
                        </Tag>
                    ) : null}
                    {type ? (
                        <Tag color={COMPLAINT_TYPE_COLOR_MAP[type]}>
                            {complaint.type_label ?? type}
                        </Tag>
                    ) : null}
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {complaint.content ?? "暂无内容"}
            </div>

            {status === "resolved" && complaint.admin_feedback ? (
                <div className="rounded-xl border border-dashed border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    <div className="font-medium">管理员反馈</div>
                    <div className="mt-1 whitespace-pre-wrap text-green-700/90">
                        {complaint.admin_feedback}
                    </div>
                </div>
            ) : null}

            <div className="text-xs text-slate-400">
                创建于 {formatDateTime(complaint.created_at)}
                {complaint.updated_at && complaint.updated_at !== complaint.created_at
                    ? ` · 更新于 ${formatDateTime(complaint.updated_at)}`
                    : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    shape="round"
                    icon={<FileTextOutlined />}
                    className="border-slate-200 text-slate-700 shadow-none"
                    onClick={() => id && onView(id)}
                >
                    查看详情
                </Button>
            </div>

            {status === "pending" ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    等待管理员处理。
                </div>
            ) : null}
        </div>
    );
}



type ComplaintDetailModalProps = {
    complaintId: number | null;
    onClose: () => void;
};

function ComplaintDetailModal({ complaintId, onClose }: ComplaintDetailModalProps) {
    const complaintsQuery = useComplaintListQuery({ page: 1, pageSize: 100 });
    const complaint = useMemo<ComplaintRecord | undefined>(
        () =>
            (complaintsQuery.data?.data?.items as ComplaintRecord[] | undefined)?.find(
                (item) => item.id === complaintId
            ),
        [complaintsQuery.data?.data?.items, complaintId]
    );

    return (
        <PopWindow open={complaintId !== null} title="投诉详情" onClose={onClose}>
            {complaintsQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Spin />
                </div>
            ) : !complaint ? (
                <Empty description="未找到投诉信息" />
            ) : (
                <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-base font-semibold text-slate-900">
                            {complaint.type_label ??
                                COMPLAINT_TYPE_OPTIONS.find((opt) => opt.value === complaint.type)
                                    ?.label ??
                                "投诉"}
                        </div>
                        <div className="flex items-center gap-1">
                            {complaint.status ? (
                                <Tag color={STATUS_COLOR_MAP[complaint.status]}>
                                    {complaint.status_label ?? complaint.status}
                                </Tag>
                            ) : null}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">投诉内容</div>
                        <pre className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            {complaint.content || "暂无内容"}
                        </pre>
                    </div>
                    {complaint.admin_feedback ? (
                        <div>
                            <div className="text-xs text-slate-400">管理员反馈</div>
                            <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                {complaint.admin_feedback}
                            </pre>
                        </div>
                    ) : null}
                    <Divider className="my-2! border-slate-200!" />
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                        <div>
                            <div className="text-slate-400">创建时间</div>
                            <div className="mt-1 text-slate-700">
                                {formatDateTime(complaint.created_at)}
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-400">更新时间</div>
                            <div className="mt-1 text-slate-700">
                                {formatDateTime(complaint.updated_at)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PopWindow>
    );
}



export default function Complaint() {
    const profileQuery = useProfileQuery();
    const role = profileQuery.data?.data?.role;
    const isTenant = role === "tenant";

    const [activeTab, setActiveTab] = useState<ComplaintTabValue>("all");
    const [submissionOpen, setSubmissionOpen] = useState(false);
    const [detailComplaintId, setDetailComplaintId] = useState<number | null>(null);

    const complaintListParams = useMemo(
        () => ({
            page: 1,
            pageSize: 50,
            ...(activeTab === "all" ? {} : { status: activeTab }),
        }),
        [activeTab]
    );
    const complaintsQuery = useComplaintListQuery(complaintListParams);
    const complaints = useMemo<ComplaintRecord[]>(
        () => (complaintsQuery.data?.data?.items as ComplaintRecord[] | undefined) ?? [],
        [complaintsQuery.data?.data?.items]
    );
    const totalLabel = complaintsQuery.data?.data?.total;

    return (
        <div className="space-y-6">
            <ComplaintHeader
                onCreate={() => {
                    setSubmissionOpen(true);
                }}
                displayCreate={isTenant}
            />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                            My Complaints
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">投诉记录</h2>
                    </div>
                    <Segmented
                        options={STATUS_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as ComplaintTabValue)}
                    />
                </div>

                <Divider className="my-6! border-slate-200!" />

                {complaintsQuery.isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spin />
                    </div>
                ) : null}

                {!complaintsQuery.isLoading && complaints.length === 0 ? (
                    <Empty
                        description={
                            <span className="text-sm text-slate-500">
                                {activeTab === "all" ? "暂无投诉记录" : "当前状态下没有投诉"}
                            </span>
                        }
                    />
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {complaints.map((complaint) => (
                        <ComplaintCard
                            key={complaint.id}
                            complaint={complaint}
                            onView={(id) => setDetailComplaintId(id)}
                        />
                    ))}
                </div>

                {typeof totalLabel === "number" ? (
                    <div className="mt-4 text-right text-xs text-slate-400">
                        共 {totalLabel} 条记录
                    </div>
                ) : null}
            </section>

            <ComplaintPopWindow
                open={submissionOpen}
                onClose={() => setSubmissionOpen(false)}
                onCompleted={() => {
                    complaintsQuery.refetch();
                }}
            />
            <ComplaintDetailModal
                complaintId={detailComplaintId}
                onClose={() => setDetailComplaintId(null)}
            />
        </div>
    );
}
