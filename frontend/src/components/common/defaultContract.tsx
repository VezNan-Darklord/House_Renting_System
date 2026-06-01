import { useEffect } from "react";
import {
    Button,
    DatePicker,
    Form,
    Input,
    Modal,
    Select,
    message,
} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useCreateContractMutation } from "../../../api/hooks/contractHooks";

const LEASE_TERM_OPTIONS = [
    { label: "6 个月", value: 6 },
    { label: "12 个月", value: 12 },
    { label: "18 个月", value: 18 },
    { label: "24 个月", value: 24 },
];

type DefaultContractValues = {
    move_in_date: Dayjs;
    lease_months: number;
    note?: string;
};

type DefaultContractProps = {
    open: boolean;
    onClose: () => void;
    houseId?: number;
    houseInfo?: string;
    monthlyRent?: number;
    onSuccess?: () => void;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

export default function DefaultContract({
    open,
    onClose,
    houseId,
    houseInfo,
    monthlyRent,
    onSuccess,
}: DefaultContractProps) {
    const [form] = Form.useForm<DefaultContractValues>();
    const createContractMutation = useCreateContractMutation();

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                move_in_date: dayjs(),
                lease_months: 12,
            });
        } else {
            form.resetFields();
        }
    }, [open, form]);

    const handleSubmit = async () => {
        if (!houseId) {
            message.error("房源信息缺失，无法提交申请");
            return;
        }
        try {
            await createContractMutation.mutateAsync({ house_id: houseId });
            message.success("租房申请已提交，等待房东确认");
            onSuccess?.();
            onClose();
        } catch (error) {
            const msg = extractErrorMessage(error, "租房申请失败");
            message.error(msg);
        }
    };

    const submitting = createContractMutation.isPending;
    const hasHouseContext = Boolean(houseInfo) || monthlyRent !== undefined;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <div className="flex items-center gap-2">
                    <HomeOutlined className="text-orange-500" />
                    <span>申请租房</span>
                </div>
            }
            footer={null}
            width={560}
            destroyOnClose
        >
            {hasHouseContext ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {houseInfo ? (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">房源</span>
                            <span className="text-right font-medium text-slate-800">
                                {houseInfo}
                            </span>
                        </div>
                    ) : null}
                    {monthlyRent !== undefined ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-slate-400">月租参考</span>
                            <span className="font-semibold text-orange-500">¥{monthlyRent}/月</span>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-3 text-xs text-orange-700">
                提交后系统会创建一份待房东确认的租房合同。
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                initialValues={{ lease_months: 12, move_in_date: dayjs() }}
            >
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
