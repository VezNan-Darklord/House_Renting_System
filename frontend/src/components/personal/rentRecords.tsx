import { useMemo, useState } from "react";
import { Alert, Button, Divider, Empty, Popconfirm, Segmented, Spin, Tag, message } from "antd";
import { BellOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import {
    useConfirmPaymentMutation,
    useRemindPaymentMutation,
    useRentRecordsQuery,
} from "../../../api/hooks/rentHooks";
import { useContractListQuery } from "../../../api/hooks/contractHooks";
import type { Contract, RentStatus } from "../../../api";

const RENT_TABS: { label: string; value: RentStatus | "all" }[] = [
    { label: "全部", value: "all" },
    { label: "未支付", value: "unpaid" },
    { label: "已支付", value: "paid" },
];

type RentTabValue = RentStatus | "all";

const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("zh-CN", { hour12: false });
};

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

export default function RentRecords() {
    const profileQuery = useProfileQuery();
    const role = profileQuery.data?.data?.role;

    const [activeTab, setActiveTab] = useState<RentTabValue>("all");

    const rentQuery = useRentRecordsQuery({ page: 1, pageSize: 50 });
    const rentItems = useMemo(() => rentQuery.data?.data?.items ?? [], [rentQuery.data?.data?.items]);
    const total = rentQuery.data?.data?.total;

    const contractsQuery = useContractListQuery({ page: 1, pageSize: 100 });
    const contractMap = useMemo(() => {
        const map = new Map<number, Contract>();
        (contractsQuery.data?.data?.items as Contract[] | undefined)?.forEach((item) => {
            if (item.id !== undefined) {
                map.set(item.id, item);
            }
        });
        return map;
    }, [contractsQuery.data?.data?.items]);

    const filtered = useMemo(() => {
        if (activeTab === "all") return rentItems;
        return rentItems.filter((item) => item.status === activeTab);
    }, [rentItems, activeTab]);

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                            Rent Records
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">租金记录</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            合同生效后系统会自动生成 12 期租金账单，可在下方完成支付确认。
                        </p>
                    </div>
                    <Segmented
                        options={RENT_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as RentTabValue)}
                    />
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                {rentQuery.isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spin />
                    </div>
                ) : null}

                {!rentQuery.isLoading && filtered.length === 0 ? (
                    <Empty
                        description={
                            <span className="text-sm text-slate-500">
                                {activeTab === "all" ? "暂无租金记录" : "当前状态下没有租金记录"}
                            </span>
                        }
                    />
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((item) => {
                        const contract =
                            item.contract_id !== undefined ? contractMap.get(item.contract_id) : undefined;
                        return (
                            <RentRecordCard
                                key={item.id}
                                rentId={item.id}
                                month={item.month}
                                amount={item.amount}
                                status={item.status}
                                statusLabel={item.status_label}
                                paidAt={item.paid_at}
                                contract={contract}
                                role={role}
                            />
                        );
                    })}
                </div>

                {typeof total === "number" ? (
                    <div className="mt-4 text-right text-xs text-slate-400">共 {total} 条记录</div>
                ) : null}
            </section>
        </div>
    );
}

type RentRecordCardProps = {
    rentId?: number;
    month?: string;
    amount?: number;
    status?: RentStatus;
    statusLabel?: string;
    paidAt?: string;
    contract?: Contract;
    role?: string;
};

function RentRecordCard({
    rentId,
    month,
    amount,
    status,
    statusLabel,
    paidAt,
    contract,
    role,
}: RentRecordCardProps) {
    const confirmMutation = useConfirmPaymentMutation();
    const remindMutation = useRemindPaymentMutation();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const isTenant = role === "tenant";
    const isLandlord = role === "landlord";
    const isPaid = status === "paid";

    const handleConfirm = async () => {
        if (!rentId) return;
        setErrorMessage(null);
        try {
            await confirmMutation.mutateAsync({ rent_id: rentId });
            message.success("已确认线下付款");
        } catch (error) {
            const msg = extractErrorMessage(error, "确认付款失败");
            setErrorMessage(msg);
            message.error(msg);
        }
    };

    const handleRemind = async () => {
        if (!rentId) return;
        setErrorMessage(null);
        try {
            await remindMutation.mutateAsync({ rent_id: rentId });
            message.success("已发送付款提醒");
        } catch (error) {
            const msg = extractErrorMessage(error, "提醒失败");
            setErrorMessage(msg);
            message.error(msg);
        }
    };

    const submitting = confirmMutation.isPending || remindMutation.isPending;

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200 hover:bg-white">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-base font-semibold text-slate-900">{month ?? "--"}</div>
                    <div className="mt-1 text-xs text-slate-500">
                        {contract?.house_address ?? "未关联合同"}
                    </div>
                </div>
                <Tag color={isPaid ? "green" : "gold"}>{statusLabel ?? (isPaid ? "已支付" : "未支付")}</Tag>
            </div>

            <div className="text-2xl font-semibold text-orange-500">¥{amount ?? "--"}</div>

            <Divider className="my-0! border-slate-200!" />

            <div className="text-xs text-slate-400">
                {isPaid ? `付款时间：${formatDate(paidAt)}` : "尚未支付"}
            </div>

            {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

            {!isPaid && isTenant ? (
                <Popconfirm
                    title="确认已线下支付？"
                    description="请确认您已通过约定方式完成付款后再操作。"
                    okText="确认已支付"
                    cancelText="取消"
                    onConfirm={handleConfirm}
                >
                    <Button
                        type="primary"
                        shape="round"
                        icon={<CheckCircleOutlined />}
                        loading={submitting}
                        className="bg-orange-500! font-medium! shadow-none!"
                    >
                        确认已支付
                    </Button>
                </Popconfirm>
            ) : null}

            {!isPaid && isLandlord ? (
                <Button
                    shape="round"
                    icon={<BellOutlined />}
                    loading={submitting}
                    onClick={handleRemind}
                >
                    提醒租客付款
                </Button>
            ) : null}
        </div>
    );
}
