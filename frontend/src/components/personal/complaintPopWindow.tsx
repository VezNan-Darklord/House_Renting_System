import { message, Segmented, Input, Alert, Button, Select, Spin, Empty } from "antd";
import { useState, useEffect, useMemo } from "react";
import { Form } from "antd";
import { useCreateComplaintMutation } from "../../../api/hooks/complaintHooks";
import { useChatRoomsQuery } from "../../../api/hooks/chatHooks";
import { useContractListQuery } from "../../../api/hooks/contractHooks";
import type { ComplaintType } from "../../../api";
import type { ChatRoom as ChatRoomType } from "../../../api";
import type { Contract as ContractType } from "../../../api";
import PopWindow from "../common/PopWindow";

type ComplaintSubmissionModalProps = {
    open: boolean;
    onClose: () => void;
    onCompleted?: () => void;
};

type ComplaintFormValues = {
    type: ComplaintType;
    content: string;
    landlord_id?: number;
    house_id?: number;
};

const COMPLAINT_TYPE_OPTIONS: { label: string; value: ComplaintType }[] = [
    { label: "房源问题", value: "house" },
    { label: "房东问题", value: "landlord" },
    { label: "其他问题", value: "other" },
];

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

type LandlordOption = {
    id: number;
    nickname: string;
    source: "chat" | "contract" | "both";
};

const buildLandlordOptions = (
    chatRooms: ChatRoomType[],
    contracts: ContractType[]
): LandlordOption[] => {
    const map = new Map<number, LandlordOption>();
    for (const room of chatRooms) {
        if (typeof room.landlord_id === "number") {
            const existing = map.get(room.landlord_id);
            if (existing) {
                if (existing.source === "contract") existing.source = "both";
            } else {
                map.set(room.landlord_id, {
                    id: room.landlord_id,
                    nickname: room.other_user_nickname ?? "匿名房东",
                    source: "chat",
                });
            }
        }
    }
    for (const contract of contracts) {
        if (typeof contract.landlord_id === "number") {
            const existing = map.get(contract.landlord_id);
            if (existing) {
                if (existing.source === "chat") existing.source = "both";
                if (contract.landlord_nickname) existing.nickname = contract.landlord_nickname;
            } else {
                map.set(contract.landlord_id, {
                    id: contract.landlord_id,
                    nickname: contract.landlord_nickname ?? "匿名房东",
                    source: "contract",
                });
            }
        }
    }
    return Array.from(map.values()).sort((a, b) => a.nickname.localeCompare(b.nickname, "zh-Hans-CN"));
};

const LANDLORD_SOURCE_LABEL: Record<LandlordOption["source"], string> = {
    chat: "聊过天",
    contract: "签过约",
    both: "聊过天 · 签过约",
};

type HouseOption = {
    id: number;
    label: string;
    source: "chat" | "contract" | "both";
};

const buildHouseOptions = (
    chatRooms: ChatRoomType[],
    contracts: ContractType[]
): HouseOption[] => {
    const map = new Map<number, HouseOption>();
    for (const room of chatRooms) {
        if (typeof room.house_id === "number") {
            const existing = map.get(room.house_id);
            if (existing) {
                if (existing.source === "contract") existing.source = "both";
            } else {
                map.set(room.house_id, {
                    id: room.house_id,
                    label: room.house_info ?? `房源 #${room.house_id}`,
                    source: "chat",
                });
            }
        }
    }
    for (const contract of contracts) {
        if (typeof contract.house_id === "number") {
            const existing = map.get(contract.house_id);
            if (existing) {
                if (existing.source === "chat") existing.source = "both";
                const contracted = contract.house_address ?? contract.house_layout ?? "";
                if (contracted) existing.label = contracted;
            } else {
                const label =
                    contract.house_address && contract.house_layout
                        ? `${contract.house_address} · ${contract.house_layout}`
                        : contract.house_address || `房源 #${contract.house_id}`;
                map.set(contract.house_id, {
                    id: contract.house_id,
                    label,
                    source: "contract",
                });
            }
        }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
};

const HOUSE_SOURCE_LABEL: Record<HouseOption["source"], string> = {
    chat: "聊过天",
    contract: "签过约",
    both: "聊过天 · 签过约",
};

export default function ComplaintSubmissionModal({ open, onClose, onCompleted }: ComplaintSubmissionModalProps) {
    const [form] = Form.useForm<ComplaintFormValues>();
    const createMutation = useCreateComplaintMutation();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedType = Form.useWatch("type", form) as ComplaintType | undefined;
    const needLandlord = selectedType === "landlord";
    const needHouse = selectedType === "house";

    const chatRoomsQuery = useChatRoomsQuery(open);
    const contractsQuery = useContractListQuery({ page: 1, pageSize: 100 }, open);

    const chatRooms = useMemo<ChatRoomType[]>(
        () => (chatRoomsQuery.data?.data as ChatRoomType[] | undefined) ?? [],
        [chatRoomsQuery.data?.data]
    );
    const contracts = useMemo<ContractType[]>(
        () => (contractsQuery.data?.data?.items as ContractType[] | undefined) ?? [],
        [contractsQuery.data?.data?.items]
    );

    const landlordOptions = useMemo(
        () => buildLandlordOptions(chatRooms, contracts),
        [chatRooms, contracts]
    );
    const houseOptions = useMemo(
        () => buildHouseOptions(chatRooms, contracts),
        [chatRooms, contracts]
    );

    const loadingOptions = chatRoomsQuery.isLoading || contractsQuery.isLoading;
    const noLandlordAvailable = !loadingOptions && landlordOptions.length === 0;
    const noHouseAvailable = !loadingOptions && houseOptions.length === 0;

    useEffect(() => {
        if (open) {
            form.resetFields();
            form.setFieldsValue({ type: "other", landlord_id: undefined, house_id: undefined });
        }
    }, [open, form]);

    const handleClose = () => {
        if (submitting) return;
        setErrorMessage(null);
        onClose();
    };

    const handleSubmit = async (values: ComplaintFormValues) => {
        setSubmitting(true);
        setErrorMessage(null);
        try {
            const payload: {
                type: ComplaintType;
                content: string;
                landlord_id?: number;
                house_id?: number;
            } = {
                type: values.type,
                content: values.content.trim(),
            };
            if (values.type === "landlord") {
                payload.landlord_id = values.landlord_id;
            } else if (values.type === "house") {
                payload.house_id = values.house_id;
            }
            await createMutation.mutateAsync(payload);
            message.success("投诉已提交");
            onCompleted?.();
            onClose();
        } catch (error) {
            const msg = extractErrorMessage(error, "提交投诉失败");
            setErrorMessage(msg);
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const submitDisabled =
        submitting ||
        (needLandlord && noLandlordAvailable) ||
        (needHouse && noHouseAvailable);

    return (
        <PopWindow
            open={open}
            onClose={handleClose}
            title="提交投诉"
        >
            <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm text-orange-700">
                请如实描述您遇到的问题，管理员会在处理后给您反馈。
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                initialValues={{ type: "other" }}
            >
                <Form.Item
                    label="投诉类型"
                    name="type"
                    rules={[{ required: true, message: "请选择投诉类型" }]}
                >
                    <Segmented options={COMPLAINT_TYPE_OPTIONS} block />
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                        prev.type !== curr.type || prev.landlord_id !== curr.landlord_id
                    }
                >
                    {() => (
                        <Form.Item
                            label="被投诉房东"
                            name="landlord_id"
                            hidden={!needLandlord}
                            preserve={false}
                            rules={
                                needLandlord
                                    ? [{ required: true, message: "请选择被投诉的房东" }]
                                    : []
                            }
                            extra={
                                needLandlord
                                    ? noLandlordAvailable
                                        ? "您还没有与任何房东建立过聊天或合同，无法投诉具体的房东"
                                        : "可选范围：您聊过天或签过合同的房东"
                                    : undefined
                            }
                        >
                            {loadingOptions ? (
                                <div className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                                    <Spin size="small" />
                                </div>
                            ) : noLandlordAvailable ? (
                                <Empty
                                    description={
                                        <span className="text-xs text-slate-500">
                                            暂无可投诉的房东
                                        </span>
                                    }
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            ) : (
                                <Select
                                    placeholder="请选择房东"
                                    showSearch
                                    optionFilterProp="label"
                                    options={landlordOptions.map((opt) => ({
                                        value: opt.id,
                                        label: opt.nickname,
                                        source: LANDLORD_SOURCE_LABEL[opt.source],
                                    }))}
                                    optionRender={(option) => (
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate">{option.label}</span>
                                            <span className="text-[11px] text-slate-400">
                                                {option.data?.source}
                                            </span>
                                        </div>
                                    )}
                                />
                            )}
                        </Form.Item>
                    )}
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                        prev.type !== curr.type || prev.house_id !== curr.house_id
                    }
                >
                    {() => (
                        <Form.Item
                            label="被投诉房源"
                            name="house_id"
                            hidden={!needHouse}
                            preserve={false}
                            rules={
                                needHouse
                                    ? [{ required: true, message: "请选择被投诉的房源" }]
                                    : []
                            }
                            extra={
                                needHouse
                                    ? noHouseAvailable
                                        ? "您还没有与任何房源建立过聊天或合同，无法投诉具体的房源"
                                        : "可选范围：您聊过天或签过合同的房源；提交后房东会由系统自动关联"
                                    : undefined
                            }
                        >
                            {loadingOptions ? (
                                <div className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                                    <Spin size="small" />
                                </div>
                            ) : noHouseAvailable ? (
                                <Empty
                                    description={
                                        <span className="text-xs text-slate-500">
                                            暂无可投诉的房源
                                        </span>
                                    }
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            ) : (
                                <Select
                                    placeholder="请选择房源"
                                    showSearch
                                    optionFilterProp="label"
                                    options={houseOptions.map((opt) => ({
                                        value: opt.id,
                                        label: opt.label,
                                        source: HOUSE_SOURCE_LABEL[opt.source],
                                    }))}
                                    optionRender={(option) => (
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate">{option.label}</span>
                                            <span className="text-[11px] text-slate-400">
                                                {option.data?.source}
                                            </span>
                                        </div>
                                    )}
                                />
                            )}
                        </Form.Item>
                    )}
                </Form.Item>

                <Form.Item
                    label="投诉内容"
                    name="content"
                    rules={[
                        { required: true, message: "请填写投诉内容" },
                        { min: 5, message: "投诉内容至少 5 个字" },
                        { max: 500, message: "投诉内容不能超过 500 字" },
                    ]}
                >
                    <Input.TextArea
                        placeholder="请详细描述您遇到的问题，便于管理员快速处理"
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
                        disabled={submitDisabled}
                        className="bg-orange-500! font-semibold! shadow-none!"
                    >
                        提交投诉
                    </Button>
                </div>
            </Form>
        </PopWindow>
    );
}
