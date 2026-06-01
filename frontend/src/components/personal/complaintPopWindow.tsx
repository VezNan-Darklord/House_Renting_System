import { message, Segmented, Input, Alert, Button } from "antd";
import { useState, useEffect } from "react";
import { Form } from "antd";
import { useCreateComplaintMutation } from "../../../api/hooks/complaintHooks";
import type { ComplaintType } from "../../../api";
import PopWindow from "../common/PopWindow";

type ComplaintSubmissionModalProps = {
    open: boolean;
    onClose: () => void;
    onCompleted?: () => void;
};

type ComplaintFormValues = {
    type: ComplaintType;
    content: string;
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

export default function ComplaintSubmissionModal({ open, onClose, onCompleted }: ComplaintSubmissionModalProps) {
    const [form] = Form.useForm<ComplaintFormValues>();
    const createMutation = useCreateComplaintMutation();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            form.resetFields();
            form.setFieldsValue({ type: "other" });
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
            await createMutation.mutateAsync({
                type: values.type,
                content: values.content.trim(),
            });
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
                        className="bg-orange-500! font-semibold! shadow-none!"
                    >
                        提交投诉
                    </Button>
                </div>
            </Form>
        </PopWindow>
    );
}