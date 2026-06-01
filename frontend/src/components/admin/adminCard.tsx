import { Spin } from "antd";
import {
    IssuesCloseOutlined,
    TeamOutlined,
    VerticalRightOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import UserManagement from "./userManagement";
import AdminComplaint from "./adminComplaint";
import { useUserContext } from "../userContext";



type AdminPage = "users" | "complaint";

export default function AdminCard() {
    const { isLoggedIn } = useUserContext();
    const navigate = useNavigate();
    const profileQuery = useProfileQuery(isLoggedIn);
    const profile = profileQuery.data?.data;
    const role = profile?.role;

    const [page, setPage] = useState<AdminPage>("users");

    const sideItems = [
        { key: "back", label: "返回首页", icon: <VerticalRightOutlined />, onClick: () => navigate("/") },
        { key: "users", label: "用户管理", icon: <TeamOutlined />, onClick: () => setPage("users") },
        { key: "complaint", label: "投诉处理", icon: <IssuesCloseOutlined />, onClick: () => setPage("complaint") },
    ];

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#faf7f2] text-slate-900">
                <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                        <h2 className="text-xl font-semibold text-slate-900">请先登录</h2>
                        <p className="mt-2 text-sm text-slate-500">登录后可进入管理员后台</p>
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

    if (role && role !== "admin") {
        return (
            <div className="min-h-screen bg-[#faf7f2] text-slate-900">
                <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                        <h2 className="text-xl font-semibold text-slate-900">无访问权限</h2>
                        <p className="mt-2 text-sm text-slate-500">仅管理员可访问此页面</p>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
                    <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            Admin
                        </div>
                        <div className="mt-5 space-y-2">
                            {sideItems.map((item) => (
                                <div
                                    key={item.key}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                                        page === item.key
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
                    {page === "users" ? <UserManagement /> : null}
                    {page === "complaint" ? <AdminComplaint /> : null}
                </div>
            </main>
        </div>
    );
}
