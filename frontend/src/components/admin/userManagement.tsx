import { useMemo, useState } from "react";
import {
    Alert,
    Avatar,
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
    KeyOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useAdminUsersQuery, useResetPasswordMutation } from "../../../api/hooks/adminHooks";
import type { User, UserRole } from "../../../api";


const ROLE_TABS: { label: string; value: UserRole | "all" }[] = [
    { label: "全部", value: "all" },
    { label: "房东", value: "landlord" },
    { label: "租客", value: "tenant" },
];

const ROLE_COLOR_MAP: Record<UserRole, string> = {
    admin: "purple",
    landlord: "blue",
    tenant: "green",
};

const ROLE_LABEL_MAP: Record<UserRole, string> = {
    admin: "管理员",
    landlord: "房东",
    tenant: "租客",
};

type RoleTabValue = UserRole | "all";

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

type UserCardProps = {
    user: User;
    onResetPassword: (user: User) => void;
};

function UserCardItem({ user, onResetPassword }: UserCardProps) {
    const role = user.role;
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200 hover:bg-white">
            <div className="flex items-start gap-3">
                <Avatar size={56} icon={<UserOutlined />} src={user.avatar || undefined}>
                    {user.nickname?.[0]}
                </Avatar>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold text-slate-900">
                        {user.nickname ?? "未命名用户"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                        {role ? (
                            <Tag color={ROLE_COLOR_MAP[role]} className="mr-0!">
                                {ROLE_LABEL_MAP[role]}
                            </Tag>
                        ) : null}
                        {user.is_active === false ? (
                            <Tag color="default" className="mr-0!">
                                已禁用
                            </Tag>
                        ) : (
                            <Tag color="cyan" className="mr-0!">
                                正常
                            </Tag>
                        )}
                    </div>
                </div>
            </div>

            <Divider className="my-0! border-slate-200!" />

            <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2 truncate">
                    <MailOutlined className="shrink-0 text-slate-400" />
                    <span className="truncate">{user.email ?? "--"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <PhoneOutlined className="shrink-0 text-slate-400" />
                    <span>{user.phone || "未填写"}</span>
                </div>
            </div>

            <Button
                shape="round"
                icon={<KeyOutlined />}
                className="border-slate-200 text-slate-700 shadow-none"
                onClick={() => onResetPassword(user)}
            >
                重置密码
            </Button>
        </div>
    );
}

type ResetPasswordModalProps = {
    user: User | null;
    onClose: () => void;
    onCompleted?: () => void;
};

type ResetPasswordValues = {
    new_password: string;
    confirm_password: string;
};

function ResetPasswordModal({ user, onClose, onCompleted }: ResetPasswordModalProps) {
    const [form] = Form.useForm<ResetPasswordValues>();
    const resetMutation = useResetPasswordMutation();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleClose = () => {
        if (submitting) return;
        form.resetFields();
        setErrorMessage(null);
        onClose();
    };

    const handleSubmit = async (values: ResetPasswordValues) => {
        if (!user?.id) return;
        if (values.new_password !== values.confirm_password) {
            setErrorMessage("两次输入的密码不一致");
            return;
        }
        setSubmitting(true);
        setErrorMessage(null);
        try {
            await resetMutation.mutateAsync({
                user_id: user.id,
                new_password: values.new_password,
            });
            message.success(`已重置用户 ${user.nickname ?? user.id} 的密码`);
            onCompleted?.();
            onClose();
        } catch (error) {
            const msg = extractErrorMessage(error, "重置密码失败");
            setErrorMessage(msg);
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={user !== null}
            onCancel={handleClose}
            title={
                <span>
                    重置密码
                    {user?.nickname ? (
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({user.nickname})
                        </span>
                    ) : null}
                </span>
            }
            footer={null}
            width={520}
        >
            <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-3 text-sm text-orange-700">
                请输入新的登录密码，至少 6 位。提交后立即生效。
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
            >
                <Form.Item
                    label="新密码"
                    name="new_password"
                    rules={[
                        { required: true, message: "请输入新密码" },
                        { min: 6, message: "密码至少 6 位" },
                        { max: 32, message: "密码不能超过 32 位" },
                    ]}
                >
                    <Input.Password placeholder="请输入新密码" />
                </Form.Item>
                <Form.Item
                    label="确认密码"
                    name="confirm_password"
                    rules={[
                        { required: true, message: "请再次输入新密码" },
                        { min: 6, message: "密码至少 6 位" },
                    ]}
                >
                    <Input.Password placeholder="请再次输入新密码" />
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
                        确认重置
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}



export default function UserManagement() {
    const [activeRole, setActiveRole] = useState<RoleTabValue>("all");
    const [resetTarget, setResetTarget] = useState<User | null>(null);

    const params = useMemo(
        () => ({
            page: 1,
            pageSize: 100,
            ...(activeRole === "all" ? {} : { role: activeRole as UserRole }),
        }),
        [activeRole]
    );
    const usersQuery = useAdminUsersQuery(params);

    const users = useMemo<User[]>(
        () => (usersQuery.data?.data?.items.filter((item:User)=>item.role !== 'admin')) ?? [],
        [usersQuery.data?.data?.items]
    );
    const totalLabel = usersQuery.data?.data?.total;

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">
                            Users
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">用户管理</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            查看平台所有用户，并通过角色标签快速筛选，可对任意用户进行密码重置。
                        </p>
                    </div>
                    <Segmented
                        options={ROLE_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
                        value={activeRole}
                        onChange={(value) => setActiveRole(value as RoleTabValue)}
                    />
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                {usersQuery.isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spin />
                    </div>
                ) : null}

                {!usersQuery.isLoading && users.length === 0 ? (
                    <Empty description={<span className="text-sm text-slate-500">当前角色下暂无用户</span>} />
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {users.map((user) => (
                        <UserCardItem
                            key={user.id}
                            user={user}
                            onResetPassword={(target) => setResetTarget(target)}
                        />
                    ))}
                </div>

                {typeof totalLabel === "number" ? (
                    <div className="mt-4 text-right text-xs text-slate-400">共 {totalLabel} 位用户</div>
                ) : null}
            </section>

            <ResetPasswordModal
                user={resetTarget}
                onClose={() => setResetTarget(null)}
                onCompleted={() => {
                    usersQuery.refetch();
                }}
            />
        </div>
    );
}
