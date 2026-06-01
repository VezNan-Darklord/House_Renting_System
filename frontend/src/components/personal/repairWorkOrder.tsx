import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Divider,
    Empty,
    Form,
    Input,
    Popconfirm,
    Segmented,
    Select,
    Spin,
    Tag,
    message,
} from "antd";
import {
    CheckCircleOutlined,
    FileTextOutlined,
    PlayCircleOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import {
    useCreateRepairMutation,
    useRepairListQuery,
    useUpdateRepairStatusMutation,
} from "../../../api/hooks/repairHooks";
import { useContractListQuery } from "../../../api/hooks/contractHooks";
import type { Contract, RepairRecord, RepairStatus, UrgencyLevel } from "../../../api";
import PopWindow from "../common/PopWindow";
import { formatDateTime } from "./contractSign";
import RepairDetailPopWindow from "./repairDetailPopWindow";



const STATUS_TABS: { label: string; value: RepairStatus | "all" }[] = [
    { label: "全部", value: "all" },
    { label: "待处理", value: "pending" },
    { label: "处理中", value: "processing" },
    { label: "已完成", value: "completed" },
];

const STATUS_COLOR_MAP: Record<RepairStatus, string> = {
    pending: "gold",
    processing: "blue",
    completed: "green",
};

const URGENCY_OPTIONS: { label: string; value: UrgencyLevel }[] = [
    { label: "普通", value: "normal" },
    { label: "紧急", value: "urgent" },
];

const URGENCY_COLOR_MAP: Record<UrgencyLevel, string> = {
    normal: "default",
    urgent: "red",
};

type RepairTabValue = RepairStatus | "all";

type RepairFormValues = {
    house_id: number;
    description: string;
    urgency: UrgencyLevel;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

type RepairHeaderProps = {
    role?: string;
    onCreate: () => void;
};

function RepairHeader({ role, onCreate }: RepairHeaderProps) {
    const isTenant = role === "tenant";
    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                        Repair
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">维修工单</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {isTenant
                            ? "租客可对在租房源提交维修申请，房东处理后会更新工单状态。"
                            : "查看您名下房源收到的维修工单，并跟进处理进度。"}
                    </p>
                </div>
                {isTenant ? (
                    <Button
                        type="primary"
                        size="large"
                        shape="round"
                        icon={<PlusOutlined />}
                        className="bg-orange-500! font-semibold! shadow-none!"
                        onClick={onCreate}
                    >
                        提交维修
                    </Button>
                ) : null}
            </div>
        </section>
    );
}

type RepairCardProps = {
    repair: RepairRecord;
    role?: string;
    onView: (id: number) => void;
};

function RepairCard({ repair, role, onView }: RepairCardProps) {
    const updateMutation = useUpdateRepairStatusMutation();
    const [actionError, setActionError] = useState<string | null>(null);

    const status = repair.status;
    const urgency = repair.urgency;
    const isLandlord = role === "landlord";
    const id = repair.id;

    const canStart = isLandlord && status === "pending";
    const canComplete = isLandlord && status === "processing";

    const handleStatusUpdate = async (next: RepairStatus) => {
        if (!id) return;
        setActionError(null);
        try {
            await updateMutation.mutateAsync({ repairId: id, data: { status: next } });
            message.success("工单状态已更新");
        } catch (error) {
            const msg = extractErrorMessage(error, "更新工单状态失败");
            setActionError(msg);
            message.error(msg);
        }
    };

    const submitting = updateMutation.isPending;

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200 hover:bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-slate-900">
                        {repair.house_address ?? "房源信息待补全"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        报修人：{repair.tenant_nickname ?? "--"}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {status ? (
                        <Tag color={STATUS_COLOR_MAP[status]}>
                            {repair.status_label ?? status}
                        </Tag>
                    ) : null}
                    {urgency ? (
                        <Tag color={URGENCY_COLOR_MAP[urgency]}>
                            {repair.urgency_label ?? (urgency === "urgent" ? "紧急" : "普通")}
                        </Tag>
                    ) : null}
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {repair.description ?? "暂无描述"}
            </div>

            <div className="text-xs text-slate-400">
                创建于 {formatDateTime(repair.created_at)}
                {repair.updated_at && repair.updated_at !== repair.created_at
                    ? ` · 更新于 ${formatDateTime(repair.updated_at)}`
                    : null}
            </div>

            {actionError ? <Alert type="error" showIcon message={actionError} /> : null}

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    shape="round"
                    icon={<FileTextOutlined />}
                    className="border-slate-200 text-slate-700 shadow-none"
                    onClick={() => id && onView(id)}
                >
                    查看详情
                </Button>
                {canStart ? (
                    <Button
                        type="primary"
                        shape="round"
                        icon={<PlayCircleOutlined />}
                        className="bg-orange-500! font-medium! shadow-none!"
                        onClick={() => handleStatusUpdate("processing")}
                        loading={submitting}
                    >
                        开始处理
                    </Button>
                ) : null}
                {canComplete ? (
                    <Popconfirm
                        title="标记为已完成？"
                        description="完成后工单将关闭，不可再修改状态。"
                        okText="完成"
                        cancelText="取消"
                        onConfirm={() => handleStatusUpdate("completed")}
                    >
                        <Button
                            type="primary"
                            shape="round"
                            icon={<CheckCircleOutlined />}
                            className="bg-orange-500! font-medium! shadow-none!"
                            loading={submitting}
                        >
                            标记完成
                        </Button>
                    </Popconfirm>
                ) : null}
            </div>

            {status === "pending" && !isLandlord ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    等待房东处理。
                </div>
            ) : null}
            {status === "processing" ? (
                <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    房东正在处理中。
                </div>
            ) : null}
            {status === "completed" ? (
                <div className="rounded-xl border border-dashed border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    维修已完成。
                </div>
            ) : null}
        </div>
    );
}

type RepairApplicationModalProps = {
    open: boolean;
    onClose: () => void;
    onCompleted?: () => void;
};

function RepairApplicationModal({ open, onClose, onCompleted }: RepairApplicationModalProps) {
    const [form] = Form.useForm<RepairFormValues>();
    const contractsQuery = useContractListQuery({ status: "active", page: 1, pageSize: 100 }, open);
    const createMutation = useCreateRepairMutation();
    const [submitting, setSubmitting] = useState(false);

    const houseOptions = useMemo(() => {
        const items = (contractsQuery.data?.data?.items as Contract[] | undefined) ?? [];
        const seen = new Set<number>();
        const result: { value: number; label: string; data: Contract }[] = [];
        items.forEach((item) => {
            if (item.house_id === undefined || seen.has(item.house_id)) return;
            seen.add(item.house_id);
            result.push({
                value: item.house_id,
                label: `${item.house_address ?? "房源"} · ${item.house_layout ?? ""} · ¥${item.monthly_rent ?? "--"}/月`,
                data: item,
            });
        });
        return result;
    }, [contractsQuery.data?.data?.items]);

    useEffect(() => {
        if (open) {
            form.setFieldsValue({ urgency: "normal" });
            form.resetFields();
            form.setFieldsValue({ urgency: "normal" });
        }
    }, [open, form]);

    const handleSubmit = async (values: RepairFormValues) => {
        if (!values.house_id) {
            message.error("请选择报修的房源");
            return;
        }
        setSubmitting(true);
        try {
            await createMutation.mutateAsync({
                house_id: values.house_id,
                description: values.description.trim(),
                urgency: values.urgency,
            });
            message.success("维修申请已提交");
            onCompleted?.();
            onClose();
        } catch (error) {
            const msg = extractErrorMessage(error, "提交维修申请失败");
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PopWindow
            open={open}
            onClose={onClose}
            title="提交维修"
        >
            <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm text-orange-700">
                只能对当前正在履行中的合同房源提交维修申请，请如实描述故障情况。
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                initialValues={{ urgency: "normal" }}
            >
                <Form.Item
                    label="报修房源"
                    name="house_id"
                    rules={[{ required: true, message: "请选择报修的房源" }]}
                >
                    <Select
                        placeholder={
                            contractsQuery.isLoading ? "合同加载中..." : "请选择正在租住的房源"
                        }
                        loading={contractsQuery.isLoading}
                        options={houseOptions}
                        optionFilterProp="label"
                        showSearch
                        notFoundContent={
                            contractsQuery.isLoading ? <Spin size="small" /> : "暂无可报修的房源"
                        }
                    />
                </Form.Item>

                <Form.Item
                    label="故障描述"
                    name="description"
                    rules={[
                        { required: true, message: "请填写故障描述" },
                        { max: 500, message: "描述不能超过 500 字" },
                    ]}
                >
                    <Input.TextArea
                        placeholder="请描述故障现象、出现位置、出现时间等关键信息"
                        autoSize={{ minRows: 4, maxRows: 6 }}
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                <Form.Item
                    label="紧急程度"
                    name="urgency"
                    rules={[{ required: true, message: "请选择紧急程度" }]}
                >
                    <Segmented options={URGENCY_OPTIONS} />
                </Form.Item>

                <div className="flex justify-end gap-3">
                    <Button onClick={onClose} disabled={submitting}>
                        取消
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        className="bg-orange-500! font-semibold! shadow-none!"
                    >
                        提交申请
                    </Button>
                </div>
            </Form>
        </PopWindow>
    );
}


export default function RepairWorkOrder() {
    const profileQuery = useProfileQuery();
    const role = profileQuery.data?.data?.role;

    const [activeTab, setActiveTab] = useState<RepairTabValue>("all");
    const [applicationOpen, setApplicationOpen] = useState(false);
    const [detailRepairId, setDetailRepairId] = useState<number | null>(null);

    const repairListParams = useMemo(
        () => ({
            page: 1,
            pageSize: 50,
            ...(activeTab === "all" ? {} : { status: activeTab }),
        }),
        [activeTab]
    );
    const repairsQuery = useRepairListQuery(repairListParams);
    const repairs = useMemo<RepairRecord[]>(
        () => (repairsQuery.data?.data?.items as RepairRecord[] | undefined) ?? [],
        [repairsQuery.data?.data?.items]
    );
    const totalLabel = repairsQuery.data?.data?.total;

    return (
        <div className="space-y-6">
            <RepairHeader
                role={role}
                onCreate={() => {
                    if (role !== "tenant") {
                        message.warning("仅租客可以提交维修申请");
                        return;
                    }
                    setApplicationOpen(true);
                }}
            />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                            Work Orders
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                            {role === "landlord" ? "收到的工单" : "我的工单"}
                        </h2>
                    </div>
                    <Segmented
                        options={STATUS_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as RepairTabValue)}
                    />
                </div>

                <Divider className="my-6! border-slate-200!" />

                {repairsQuery.isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spin />
                    </div>
                ) : null}

                {!repairsQuery.isLoading && repairs.length === 0 ? (
                    <Empty
                        description={
                            <span className="text-sm text-slate-500">
                                {activeTab === "all" ? "暂无维修工单" : "当前状态下没有工单"}
                            </span>
                        }
                    />
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {repairs.map((repair) => (
                        <RepairCard
                            key={repair.id}
                            repair={repair}
                            role={role}
                            onView={(id) => setDetailRepairId(id)}
                        />
                    ))}
                </div>

                {typeof totalLabel === "number" ? (
                    <div className="mt-4 text-right text-xs text-slate-400">
                        共 {totalLabel} 条记录
                    </div>
                ) : null}
            </section>

            <RepairApplicationModal
                open={applicationOpen}
                onClose={() => setApplicationOpen(false)}
                onCompleted={() => {
                    repairsQuery.refetch();
                }}
            />
            <RepairDetailPopWindow
                repairId={detailRepairId}
                onClose={() => setDetailRepairId(null)}
            />
        </div>
    );
}
