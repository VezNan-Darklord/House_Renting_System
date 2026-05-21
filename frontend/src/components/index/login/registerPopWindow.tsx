import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Input, Radio, message } from "antd";
import { useState } from "react";
import type { UserRole } from "../../../../api";
import { useRegisterMutation } from "../../../../api/hooks/userHooks";
import { useUserContext } from "../../userContext";

type RegisterPopWindowProps = {
    onSuccess: () => void;
    onSwitch: () => void;
};

type RegisterRole = Exclude<UserRole, "admin">;

export default function RegisterPopWindow({ onSuccess, onSwitch }: RegisterPopWindowProps) {
    const { setAuth } = useUserContext();
    const [role, setRole] = useState<RegisterRole>("tenant");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");

    const registerMutation = useRegisterMutation();

    const handleRegister = () => {
        if (!email.trim() || !password.trim() || !nickname.trim()) {
            message.warning("请完整填写注册信息");
            return;
        }
        registerMutation.mutate(
            {
                role,
                email,
                password,
                nickname,
            },
            {
                onSuccess: (response) => {
                    if (response.data?.token) {
                        setAuth(response.data.token, response.data.user);
                        setPassword("");
                        onSuccess();
                        message.success("注册成功");
                    } else {
                        message.error("注册失败，请检查账号信息");
                    }
                },
                onError: (error) => {
                    message.error(error.message ?? "注册失败");
                },
            }
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <Radio.Group value={role} onChange={(event) => setRole(event.target.value)}>
                <Radio.Button value="tenant">租客</Radio.Button>
                <Radio.Button value="landlord">房东</Radio.Button>
            </Radio.Group>
            <Input
                prefix={<UserOutlined className="text-slate-400" />}
                placeholder="请输入昵称"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
            />
            <Input
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="请输入邮箱"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="请输入密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
            />
            <Button
                type="primary"
                className="bg-slate-900! shadow-none!"
                loading={registerMutation.isPending}
                onClick={handleRegister}
            >
                注册
            </Button>
            <div className="text-center text-sm text-slate-500">
                已有账号？{" "}
                <button className="text-orange-500 hover:text-orange-600" type="button" onClick={onSwitch}>
                    去登录
                </button>
            </div>
        </div>
    );
}
