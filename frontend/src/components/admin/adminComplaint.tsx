import { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Divider,
    Empty,
    Form,
    Input,
    Modal,
    Segmented,
    Spin,
    Tag,
    message,
} from "antd";
import {
    CheckCircleOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import {
    useComplaintListQuery,
    useHandleComplaintMutation,
} from "../../../api/hooks/complaintHooks";
import type { ComplaintRecord, ComplaintStatus, ComplaintType } from "../../../api";
import PopWindow from "../common/PopWindow";
import { formatDateTime } from "../personal/contractSign";


const STATUS_TABS: { label: string; value: ComplaintStatus | "all" }[] = [
    { label: "全部", value: "all" },
    { label: "待处理", value: "pending" },
    { label: "已处理", value: "resolved" },
];

const STATUS_COLOR_MAP: Record<ComplaintStatus, string> = {
    pending: "gold",
    resolved: "green",
};

const COMPLAINT_TYPE_COLOR_MAP: Record<ComplaintType, string> = {
    house: "blue",
    landlord: "volcano",
    other: "default",
};

const COMPLAINT_TYPE_LABEL_MAP: Record<ComplaintType, string> = {
    house: "房源问题",
    landlord: "房东问题",
    other: "其他问题",
};

type ComplaintTabValue = ComplaintStatus | "all";

type HandleComplaintValues = {
    feedback: string;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

type AdminComplaintCardProps = {
    complaint: ComplaintRecord;
    onView: (id: number) => void;
    onHandle: (complaint: ComplaintRecord) => void;
};

function AdminComplaintCard({ complaint, onView, onHandle }: AdminComplaintCardProps) {
    const status = complaint.status;
    const type = complaint.type;
    const id = complaint.id;
    const canHandle = status === "pending" && id !== undefined;

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200 hover:bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-slate-900">
                        {complaint.type_label ??
                            (type ? COMPLAINT_TYPE_LABEL_MAP[type] : "投诉")}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        投诉人：{complaint.tenant_nickname ?? "--"}
                    </div>
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
                {canHandle ? (
                    <Button
                        type="primary"
                        shape="round"
                        icon={<CheckCircleOutlined />}
                        className="bg-orange-500! font-medium! shadow-none!"
                        onClick={() => id && onHandle(complaint)}
                    >
                        处理投诉
                    </Button>
                ) : null}
            </div>

            {status === "pending" ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    等待管理员处理。
                </div>
            ) : null}
        </div>
    );
}

type HandleComplaintModalProps = {
    complaint: ComplaintRecord | null;
    onClose: () => void;
    onCompleted?: () => void;
};

function HandleComplaintModal({ complaint, onClose, onCompleted }: HandleComplaintModalProps) {
    const [form] = Form.useForm<HandleComplaintValues>();
    const handleMutation = useHandleComplaintMutation();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleClose = () => {
        if (submitting) return;
        form.resetFields();
        setErrorMessage(null);
        onClose();
    };

    const handleSubmit = async (values: HandleComplaintValues) => {
        if (!complaint?.id) return;
        setSubmitting(true);
        setErrorMessage(null);
        try {
            await handleMutation.mutateAsync({
                complaint_id: complaint.id,
                feedback: values.feedback.trim(),
            });
            message.success("投诉已处理");
            onCompleted?.();
            onClose();
        } catch (error) {
            const msg = extractErrorMessage(error, "处理投诉失败");
            setErrorMessage(msg);
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={complaint !== null}
            onCancel={handleClose}
            title="处理投诉"
            footer={null}
            width={640}
            destroyOnClose
        >
            {complaint ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>投诉人：{complaint.tenant_nickname ?? "--"}</span>
                        {complaint.type ? (
                            <Tag color={COMPLAINT_TYPE_COLOR_MAP[complaint.type]} className="mr-0!">
                                {complaint.type_label ??
                                    COMPLAINT_TYPE_LABEL_MAP[complaint.type]}
                            </Tag>
                        ) : null}
                    </div>
                    <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700">
                        {complaint.content || "暂无内容"}
                    </pre>
                </div>
            ) : null}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
            >
                <Form.Item
                    label="处理反馈"
                    name="feedback"
                    rules={[
                        { required: true, message: "请填写处理反馈" },
                        { min: 5, message: "反馈内容至少 5 个字" },
                        { max: 500, message: "反馈内容不能超过 500 字" },
                    ]}
                >
                    <Input.TextArea
                        placeholder="请向投诉人说明处理结果与后续建议"
                        autoSize={{ minRows: 4, maxRows: 6 }}
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

                <div className="flex justify-end gap-3">
                    <Button onClick={handleClose} disabled={submitting}>
                        取消
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        className="bg-orange-500! font-semibold! shadow-none!"
                    >
                        提交处理
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}

type AdminComplaintDetailModalProps = {
    complaintId: number | null;
    onClose: () => void;
    onHandle: (complaint: ComplaintRecord) => void;
};

function AdminComplaintDetailModal({
    complaintId,
    onClose,
    onHandle,
}: AdminComplaintDetailModalProps) {
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
                                (complaint.type
                                    ? COMPLAINT_TYPE_LABEL_MAP[complaint.type]
                                    : "投诉")}
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
                        <div className="text-xs text-slate-400">投诉人</div>
                        <div className="mt-1 font-medium text-slate-800">
                            {complaint.tenant_nickname ?? "--"}
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
                    {complaint.status === "pending" && complaint.id !== undefined ? (
                        <div className="flex justify-end pt-2">
                            <Button
                                type="primary"
                                shape="round"
                                icon={<CheckCircleOutlined />}
                                className="bg-orange-500! font-semibold! shadow-none!"
                                onClick={() => onHandle(complaint)}
                            >
                                处理投诉
                            </Button>
                        </div>
                    ) : null}
                </div>
            )}
        </PopWindow>
    );
}



export default function AdminComplaint() {
    const [activeTab, setActiveTab] = useState<ComplaintTabValue>("all");
    const [handleTarget, setHandleTarget] = useState<ComplaintRecord | null>(null);
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
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                            Complaints
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">投诉处理</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            处理租客提交的投诉，给出处理反馈，状态变更为已处理。
                        </p>
                    </div>
                    <Segmented
                        options={STATUS_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as ComplaintTabValue)}
                    />
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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
                        <AdminComplaintCard
                            key={complaint.id}
                            complaint={complaint}
                            onView={(id) => setDetailComplaintId(id)}
                            onHandle={(target) => setHandleTarget(target)}
                        />
                    ))}
                </div>

                {typeof totalLabel === "number" ? (
                    <div className="mt-4 text-right text-xs text-slate-400">
                        共 {totalLabel} 条记录
                    </div>
                ) : null}
            </section>

            <HandleComplaintModal
                complaint={handleTarget}
                onClose={() => setHandleTarget(null)}
                onCompleted={() => {
                    complaintsQuery.refetch();
                }}
            />
            <AdminComplaintDetailModal
                complaintId={detailComplaintId}
                onClose={() => setDetailComplaintId(null)}
                onHandle={(target) => {
                    setDetailComplaintId(null);
                    setHandleTarget(target);
                }}
            />
        </div>
    );
}
