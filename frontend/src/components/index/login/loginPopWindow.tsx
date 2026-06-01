import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Button, Input, message } from "antd";
import { useMemo, useState } from "react";
import PopWindow from "../../common/PopWindow";
import { useLoginMutation } from "../../../../api/hooks/userHooks";
import { useUserContext } from "../../userContext";
import RegisterPopWindow from "./registerPopWindow";
import { useQueryClient } from "@tanstack/react-query";

type LoginPopWindowProps = {
    open: boolean;
    onClose: () => void;
};

type AuthMode = "login" | "register";

const LoginPanel = ({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch: () => void }) => {
    const queryClient = useQueryClient();
    const { setAuth } = useUserContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const loginMutation = useLoginMutation();

    const handleLogin = () => {
        if (!email.trim() || !password.trim()) {
            message.warning("请输入邮箱和密码");
            return;
        }
        loginMutation.mutate(
            { email, password },
            {
                onSuccess: (response) => {
                    if (response.data?.token) {
                        setAuth(response.data.token);
                        setPassword("");
                        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
                        onSuccess();
                        message.success("登录成功");
                    } else {
                        message.error("登录失败，请检查账号信息");
                    }
                },
                onError: (error) => {
                    message.error(error.message ?? "登录失败");
                },
            }
        );
    };

    return (
        <div className="flex flex-col gap-4">
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
                loading={loginMutation.isPending}
                onClick={handleLogin}
            >
                登录
            </Button>
            <div className="text-center text-sm text-slate-500">
                没有账号？{" "}
                <button className="text-orange-500 hover:text-orange-600" type="button" onClick={onSwitch}>
                    去注册
                </button>
            </div>
        </div>
    );
};

export default function LoginPopWindow({ open, onClose }: LoginPopWindowProps) {
    const [mode, setMode] = useState<AuthMode>("login");

    const switchToRegister = () => setMode("register");
    const switchToLogin = () => setMode("login");

    const title = useMemo(() => (mode === "login" ? "账号登录" : "账号注册"), [mode]);

    return (
        <PopWindow open={open} title={title} onClose={onClose}>
            {mode === "login" ? (
                <LoginPanel onSuccess={onClose} onSwitch={switchToRegister} />
            ) : (
                <RegisterPopWindow onSuccess={onClose} onSwitch={switchToLogin} />
            )}
        </PopWindow>
    );
}
