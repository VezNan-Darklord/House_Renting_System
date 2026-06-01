import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Button,
    DatePicker,
    Divider,
    Empty,
    Form,
    Input,
    Modal,
    Popconfirm,
    Segmented,
    Select,
    Spin,
    Tag,
    message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
    MessageOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { io, type Socket } from "socket.io-client";
import { rent, getAccessToken } from "../../../api/instance";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import {
    useConfirmContractMutation,
    useContractListQuery,
    useCreateContractMutation,
    useTerminateContractMutation,
} from "../../../api/hooks/contractHooks";
import { useCreateChatRoomMutation } from "../../../api/hooks/chatHooks";
import { useHouseListQuery } from "../../../api/hooks/houseHooks";
import type { Contract, ContractStatus, HouseListItem } from "../../../api";
import ContractDetailModal from "./contractPopwindow";
import { formatDate, formatDateTime, LEASE_TERM_OPTIONS, SOCKET_URL, STATUS_COLOR_MAP, STATUS_TABS } from "./contractSign";



type RentApplicationValues = {
    house_id: number;
    move_in_date: Dayjs;
    lease_months: number;
    note?: string;
};

type ContractTabValue = ContractStatus | "all";


const buildNoticeMessage = (values: RentApplicationValues, house: HouseListItem) => {
    const address = house.address_summary ?? "该房源";
    const date = values.move_in_date?.format("YYYY-MM-DD");
    const segments = [
        `【租房申请】我已对「${address}」发起租房申请`,
        `期望入住：${date}`,
        `租期：${values.lease_months} 个月`,
    ];
    if (values.note && values.note.trim()) {
        segments.push(`备注：${values.note.trim()}`);
    }
    segments.push("请尽快在合同管理中确认。");
    return segments.join("，");
};

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

type ContractHeaderProps = {
    role?: string;
    onCreate: () => void;
};

function ContractHeader({ role, onCreate }: ContractHeaderProps) {
    const isTenant = role === "tenant";
    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                        Rent House
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                        {isTenant ? "租房管理" : "房屋管理"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {isTenant
                            ? "浏览与申请房源，确认合同后系统将自动生成租金记录。"
                            : "查看针对您的房源发起的合同申请，并完成双方确认。"}
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
                        发起租房
                    </Button>
                ) : null}
            </div>
        </section>
    );
}

type ContractCardProps = {
    contract: Contract;
    currentUserId?: number;
    role?: string;
    onView: (id: number) => void;
};

function ContractCard({ contract, currentUserId, role, onView }: ContractCardProps) {
    const confirmMutation = useConfirmContractMutation();
    const terminateMutation = useTerminateContractMutation();
    const [actionError, setActionError] = useState<string | null>(null);

    const status = contract.status;
    const isLandlord = role === "landlord";
    const isTenant = role === "tenant";
    const tenantId = contract.tenant_id;
    const landlordId = contract.landlord_id;
    const isMine =
        Boolean(currentUserId) &&
        (currentUserId === tenantId || currentUserId === landlordId);

    const canLandlordConfirm =
        isLandlord && status === "pending_landlord" && currentUserId === landlordId;
    const canTenantConfirm =
        isTenant && status === "pending_tenant" && currentUserId === tenantId;
    const canTerminate =
        status === "active" && isMine;

    const handleConfirm = async () => {
        if (!contract.id) return;
        setActionError(null);
        try {
            await confirmMutation.mutateAsync({ contract_id: contract.id });
            message.success("合同已确认");
        } catch (error) {
            const msg = extractErrorMessage(error, "确认合同失败");
            setActionError(msg);
            message.error(msg);
        }
    };

    const handleTerminate = async () => {
        if (!contract.id) return;
        setActionError(null);
        try {
            await terminateMutation.mutateAsync(contract.id);
            message.success("合同已终止");
        } catch (error) {
            const msg = extractErrorMessage(error, "终止合同失败");
            setActionError(msg);
            message.error(msg);
        }
    };

    const submitting = confirmMutation.isPending || terminateMutation.isPending;

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200 hover:bg-white">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-base font-semibold text-slate-900">
                        {contract.house_address ?? "房源信息待补全"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        {contract.house_layout ?? "--"} · {contract.house_area ?? "--"}㎡
                    </div>
                </div>
                {status ? (
                    <Tag color={STATUS_COLOR_MAP[status]}>{contract.status_label ?? status}</Tag>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div>
                    <div className="text-xs text-slate-400">租期</div>
                    <div className="mt-1 font-medium text-slate-800">
                        {formatDate(contract.start_date)} ~ {formatDate(contract.end_date)}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-slate-400">月租 / 押金</div>
                    <div className="mt-1 font-medium text-slate-800">
                        ¥{contract.monthly_rent ?? "--"} / ¥{contract.deposit ?? "--"}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-slate-400">租客</div>
                    <div className="mt-1 font-medium text-slate-800">
                        {contract.tenant_nickname ?? "--"}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-slate-400">房东</div>
                    <div className="mt-1 font-medium text-slate-800">
                        {contract.landlord_nickname ?? "--"}
                    </div>
                </div>
            </div>

            <div className="text-xs text-slate-400">
                创建于 {formatDateTime(contract.created_at)}
            </div>

            {actionError ? (
                <Alert type="error" showIcon message={actionError} />
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    shape="round"
                    icon={<FileTextOutlined />}
                    className="border-slate-200 text-slate-700 shadow-none"
                    onClick={() => contract.id && onView(contract.id)}
                >
                    查看合同
                </Button>
                {canLandlordConfirm ? (
                    <Button
                        type="primary"
                        shape="round"
                        icon={<CheckCircleOutlined />}
                        className="bg-orange-500! font-medium! shadow-none!"
                        onClick={handleConfirm}
                        loading={submitting}
                    >
                        房东确认
                    </Button>
                ) : null}
                {canTenantConfirm ? (
                    <Button
                        type="primary"
                        shape="round"
                        icon={<CheckCircleOutlined />}
                        className="bg-orange-500! font-medium! shadow-none!"
                        onClick={handleConfirm}
                        loading={submitting}
                    >
                        租客签署
                    </Button>
                ) : null}
                {canTerminate ? (
                    <Popconfirm
                        title="确定终止这份合同吗？"
                        description="终止后房源将恢复空置状态。"
                        okText="终止"
                        cancelText="取消"
                        onConfirm={handleTerminate}
                    >
                        <Button
                            danger
                            shape="round"
                            icon={<CloseCircleOutlined />}
                            loading={submitting}
                        >
                            终止合同
                        </Button>
                    </Popconfirm>
                ) : null}
            </div>

            {status === "pending_landlord" && isTenant ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    等待房东确认。
                </div>
            ) : null}
            {status === "pending_tenant" && isLandlord ? (
                <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    等待租客签署。
                </div>
            ) : null}
        </div>
    );
}

type RentApplicationModalProps = {
    open: boolean;
    onClose: () => void;
    onCompleted?: () => void;
};

function RentApplicationModal({ open, onClose, onCompleted }: RentApplicationModalProps) {
    const [form] = Form.useForm<RentApplicationValues>();
    const watchedHouseId = Form.useWatch("house_id", form);
    const houseListQuery = useHouseListQuery({ page: 1, pageSize: 100, status: "vacant" }, open);
    const createContractMutation = useCreateContractMutation();
    const createChatRoomMutation = useCreateChatRoomMutation();
    const [submitting, setSubmitting] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const houseOptions = useMemo(() => {
        const items = (houseListQuery.data?.data?.items as HouseListItem[] | undefined) ?? [];
        return items.map((item) => ({
            value: item.id,
            label: `${item.address_summary ?? "房源"} · ${item.layout ?? ""} · ¥${item.monthly_rent ?? "--"}/月`,
            data: item,
        }));
    }, [houseListQuery.data?.data?.items]);

    const selectedHouse = useMemo(
        () => houseOptions.find((option) => option.value === watchedHouseId)?.data,
        [houseOptions, watchedHouseId]
    );

    useEffect(() => {
        if (!open) {
            form.resetFields();
        } else {
            form.setFieldsValue({
                move_in_date: dayjs(),
                lease_months: 12,
            });
        }
    }, [open, form]);

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const ensureSocket = (): Promise<Socket> => {
        return new Promise((resolve, reject) => {
            const existing = socketRef.current;
            if (existing && existing.connected) {
                resolve(existing);
                return;
            }
            const token = getAccessToken();
            if (!token) {
                reject(new Error("登录状态已失效，请重新登录"));
                return;
            }
            if (existing) {
                existing.disconnect();
                socketRef.current = null;
            }
            const socket = io(SOCKET_URL, {
                auth: { token },
                transports: ["websocket"],
                reconnection: false,
            });
            socketRef.current = socket;
            const timer = setTimeout(() => {
                socket.disconnect();
                reject(new Error("聊天服务连接超时"));
            }, 8000);
            socket.once("connect", () => {
                clearTimeout(timer);
                resolve(socket);
            });
            socket.once("connect_error", () => {
                clearTimeout(timer);
                socket.disconnect();
                socketRef.current = null;
                reject(new Error("聊天服务连接失败"));
            });
        });
    };

    const sendChatMessage = async (roomId: number, content: string) => {
        const socket = await ensureSocket();
        socket.emit("join", { room_id: roomId });
        await new Promise<void>((resolve) => setTimeout(resolve, 120));
        socket.emit("send_message", { room_id: roomId, content });
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
    };

    const handleSubmit = async (values: RentApplicationValues) => {
        if (!values.house_id) {
            message.error("请选择要租住的房源");
            return;
        }
        setSubmitting(true);
        try {
            const contractResponse = await createContractMutation.mutateAsync({
                house_id: values.house_id,
            });
            const contract = contractResponse.data;
            if (!contract?.house_id) {
                throw new Error("合同创建返回异常");
            }

            const houseDetailResponse = await rent.house.getHouseDetail(contract.house_id);
            const landlordId = houseDetailResponse.data?.landlord_id;
            if (!landlordId) {
                throw new Error("无法获取房东信息，请稍后重试");
            }

            const chatResponse = await createChatRoomMutation.mutateAsync({
                house_id: contract.house_id,
                landlord_id: landlordId,
            });
            const roomId = chatResponse.data?.id;
            if (!roomId) {
                throw new Error("创建聊天室失败，请稍后重试");
            }

            const content = buildNoticeMessage(values, selectedHouse as HouseListItem);
            try {
                await sendChatMessage(roomId, content);
            } catch (socketError) {
                const socketMsg = extractErrorMessage(socketError, "聊天室消息发送失败");
                message.warning(`${socketMsg}，合同已成功发起`);
            }

            message.success("租房申请已提交，等待房东确认");
            onCompleted?.();
            onClose();
        } catch (error) {
            const msg = extractErrorMessage(error, "租房申请失败");
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title="发起租房"
            footer={null}
            width={640}
            destroyOnClose
        >
            <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm text-orange-700">
                <div className="flex items-center gap-2 font-medium">
                    <MessageOutlined />
                    提交后会自动向房东发送一条租房申请消息
                </div>
                <div className="mt-1 text-xs text-orange-600/80">
                    请如实填写租期与入住时间，便于房东快速确认。
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                initialValues={{ lease_months: 12, move_in_date: dayjs() }}
            >
                <Form.Item
                    label="选择房源"
                    name="house_id"
                    rules={[{ required: true, message: "请选择要租住的房源" }]}
                >
                    <Select
                        placeholder={houseListQuery.isLoading ? "房源加载中..." : "请选择可租的房源"}
                        loading={houseListQuery.isLoading}
                        options={houseOptions}
                        optionFilterProp="label"
                        showSearch
                        notFoundContent={houseListQuery.isLoading ? <Spin size="small" /> : "暂无可租房源"}
                    />
                </Form.Item>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Form.Item
                        label="期望入住日期"
                        name="move_in_date"
                        rules={[{ required: true, message: "请选择期望入住日期" }]}
                    >
                        <DatePicker
                            className="w-full"
                            disabledDate={(current) => current && current.isBefore(dayjs().startOf("day"))}
                        />
                    </Form.Item>
                    <Form.Item
                        label="租期"
                        name="lease_months"
                        rules={[{ required: true, message: "请选择租期" }]}
                    >
                        <Select options={LEASE_TERM_OPTIONS} placeholder="请选择租期" />
                    </Form.Item>
                </div>

                <Form.Item label="附加说明" name="note">
                    <Input.TextArea
                        placeholder="如：希望尽快入住，可配合看房时间等"
                        autoSize={{ minRows: 3, maxRows: 5 }}
                        maxLength={200}
                        showCount
                    />
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
        </Modal>
    );
}








export default function RentHouseManage() {
    const profileQuery = useProfileQuery();
    const profile = profileQuery.data?.data;
    const role = profile?.role;
    const currentUserId = profile?.id;

    const [activeTab, setActiveTab] = useState<ContractTabValue>("all");
    const [applicationOpen, setApplicationOpen] = useState(false);
    const [detailContractId, setDetailContractId] = useState<number | null>(null);

    const contractListParams = useMemo(
        () => ({ page: 1, pageSize: 50, ...(activeTab === "all" ? {} : { status: activeTab }) }),
        [activeTab]
    );
    const contractsQuery = useContractListQuery(contractListParams);
    const contracts = useMemo<Contract[]>(
        () => (contractsQuery.data?.data?.items as Contract[] | undefined) ?? [],
        [contractsQuery.data?.data?.items]
    );
    const totalLabel = contractsQuery.data?.data?.total;

    return (
        <div className="space-y-6">
            <ContractHeader
                role={role}
                onCreate={() => {
                    if (role !== "tenant") {
                        message.warning("仅租客可以发起租房申请");
                        return;
                    }
                    setApplicationOpen(true);
                }}
            />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                            Contracts
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                            {role === "landlord" ? "收到的合同" : "我的合同"}
                        </h2>
                    </div>
                    <Segmented
                        options={STATUS_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as ContractTabValue)}
                    />
                </div>

                <Divider className="my-6! border-slate-200!" />

                {contractsQuery.isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spin />
                    </div>
                ) : null}

                {!contractsQuery.isLoading && contracts.length === 0 ? (
                    <Empty
                        description={
                            <span className="text-sm text-slate-500">
                                {activeTab === "all" ? "暂无合同记录" : "当前状态下没有合同"}
                            </span>
                        }
                    />
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {contracts.map((contract) => (
                        <ContractCard
                            key={contract.id}
                            contract={contract}
                            currentUserId={currentUserId}
                            role={role}
                            onView={(id) => setDetailContractId(id)}
                        />
                    ))}
                </div>

                {typeof totalLabel === "number" ? (
                    <div className="mt-4 text-right text-xs text-slate-400">共 {totalLabel} 条记录</div>
                ) : null}
            </section>

            <RentApplicationModal
                open={applicationOpen}
                onClose={() => setApplicationOpen(false)}
                onCompleted={() => {
                    contractsQuery.refetch();
                }}
            />
            <ContractDetailModal
                contractId={detailContractId}
                onClose={() => setDetailContractId(null)}
            />
        </div>
    );
}