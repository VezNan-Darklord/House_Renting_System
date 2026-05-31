import { DownOutlined, HomeOutlined } from "@ant-design/icons";
import { Button, Dropdown, Space, type MenuProps } from "antd";
import { useState } from "react";
import { useUserContext } from "../userContext";
import LoginPopWindow from "../index/login/loginPopWindow";
import { useNavigate } from "react-router";

export default function Header() {
    const { isLoggedIn } = useUserContext();
    const [loginOpen, setLoginOpen] = useState(false);
    const userInfo = useUserContext();
    const canPublish = isLoggedIn && (userInfo.user?.role === "landlord" || userInfo.user?.role === "admin");
    const navigate = useNavigate();

    const items: MenuProps['items'] = [
        {
            label: '个人中心',
            key: 'user',
            onClick: () => navigate("/user")
        },
        {
            label: '退出登录',
            key: 'logout',
            onClick: () => { 
                userInfo.clearAuth();
                navigate("/");
            }
        }
    ]

    return (
        <header className="fixed left-0 top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-400 items-center -translate-y-5 px-4 sm:px-6 lg:px-8">
                <div className="flex w-full flex-col gap-6">
                    <div className="flex items-center justify-between gap-4 mt-10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25">
                                <HomeOutlined className="text-xl" />
                            </div>
                            <div>
                                <div className="text-xs font-medium uppercase tracking-[0.35em] text-orange-500">House Flow</div>
                                <div className="text-2xl font-semibold tracking-tight text-slate-900">智能房屋租赁</div>
                            </div>
                        </div>
                        <div className="hidden items-center gap-3 lg:flex">
                            {isLoggedIn ? (
                                <>
                                    {canPublish && (
                                        <Button type="primary" onClick={() => navigate("/house/publish")} shape="round" className="bg-slate-900! shadow-none!">
                                            发布房源
                                        </Button>
                                    )}
                                    <Dropdown menu={{ items }}>
                                        <a onClick={(e) => e.preventDefault()}>
                                            <Space>
                                                {userInfo.user?.nickname|| "用户"}
                                                <DownOutlined />
                                            </Space>
                                        </a>
                                    </Dropdown>
                                </>
                            ) : (
                                <Button
                                    type="primary"
                                    shape="round"
                                    className="bg-slate-900! shadow-none!"
                                    onClick={() => setLoginOpen(true)}
                                >
                                    登录
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <LoginPopWindow open={loginOpen} onClose={() => setLoginOpen(false)} />
        </header>
    )
}
