import { Spin } from "antd";
import { DollarOutlined, FileTextOutlined, HomeOutlined, UserOutlined, VerticalRightOutlined } from "@ant-design/icons";
import { useUserContext } from "../userContext";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import AccountInfo from "./accountInfo";
import RentHouseManage from "./rentHouseManage";
import RentRecords from "./rentRecords";



type baseInfoItem = 'account' | 'role' | 'rent';

export default function UserCard() {
    const { isLoggedIn } = useUserContext();

    const navigate = useNavigate();
    const profileQuery = useProfileQuery(isLoggedIn);
    const profile = profileQuery.data?.data;
    const role = profile?.role;

    const [baseInfo, setBaseInfo] = useState<baseInfoItem>('account');


    const sideItems = [
        { key: "back", label: "返回首页", icon: <VerticalRightOutlined />, onClick: () => navigate("/") },
        { key: "account", label: "账号信息", icon: <UserOutlined />, onClick: () => setBaseInfo('account') },
        {
            key: "role",
            label: role === "landlord" ? "房屋管理" : "租住信息",
            icon: role === "landlord" ? <HomeOutlined /> : <FileTextOutlined />,
            onClick: () => setBaseInfo('role'),
        },
        { key: "rent", label: "租金记录", icon: <DollarOutlined />, onClick: () => setBaseInfo('rent') },
    ];


    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#faf7f2] text-slate-900">
                <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                        <h2 className="text-xl font-semibold text-slate-900">请先登录</h2>
                        <p className="mt-2 text-sm text-slate-500">登录后可查看个人信息与合同记录</p>
                    </section>
                </main>
            </div>
        );
    }

    if (profileQuery.isLoading) {
        return (
            <div className="min-h-screen bg-[#faf7f2] text-slate-900">
                <main className="mx-auto flex w-full max-w-400 items-center justify-center px-4 pb-24 pt-20 sm:px-6 lg:px-8">
                    <Spin size="large" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
                    <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Settings</div>
                        <div className="mt-5 space-y-2">
                            {sideItems.map((item) => (
                                <div
                                    key={item.key}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                                        baseInfo === item.key
                                            ? "bg-orange-50 text-orange-600"
                                            : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                    onClick={item.onClick}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </aside>
                    { baseInfo === 'account' && <AccountInfo /> }
                    { baseInfo === 'role' && <RentHouseManage /> }
                    { baseInfo === 'rent' && <RentRecords /> }

                </div>
            </main>
        </div>
    );
}
