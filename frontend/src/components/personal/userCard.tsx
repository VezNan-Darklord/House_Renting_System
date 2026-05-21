import { Avatar, Button, Divider, Spin, Tag } from "antd";
import { DollarOutlined, FileTextOutlined, HomeOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, UserOutlined, VerticalRightOutlined } from "@ant-design/icons";
import { useUserContext } from "../userContext";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import { useContractListQuery } from "../../../api/hooks/contractHooks";
import { useRentRecordsQuery } from "../../../api/hooks/rentHooks";
import { useHouseListQuery } from "../../../api/hooks/houseHooks";
import { useState } from "react";
import { useNavigate } from "react-router";

const roleLabelMap: Record<string, string> = {
    tenant: "租客",
    landlord: "房东",
    admin: "管理员",
};

type baseInfoItem = 'account' | 'role' | 'rent';

export default function UserCard() {
    const { isLoggedIn } = useUserContext();

    const navigate = useNavigate();
    const [baseInfo, setBaseInfo] = useState<baseInfoItem>('account');
    

    const profileQuery = useProfileQuery(isLoggedIn);
    const profile = profileQuery.data?.data;
    const role = profile?.role;
    const sideItems = [
        { key: "back", label: "返回首页", icon: <VerticalRightOutlined />, onClick: () => navigate("/") },
        { key: "account", label: "账号信息", icon: <UserOutlined />, onClick: () => setBaseInfo('account') },
        {
            key: "role",
            label: role === "landlord" ? "房源管理" : "租住信息",
            icon: role === "landlord" ? <HomeOutlined /> : <FileTextOutlined />,
            onClick: () => setBaseInfo('role'),
        },
        { key: "rent", label: "租金记录", icon: <DollarOutlined />, onClick: () => setBaseInfo('rent') },
    ];

    const contractsQuery = useContractListQuery({ page: 1, pageSize: 6 }, isLoggedIn);
    const rentQuery = useRentRecordsQuery({ page: 1, pageSize: 6 }, isLoggedIn);
    const houseQuery = useHouseListQuery({ page: 1, pageSize: 6 }, isLoggedIn && role === "landlord");

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

                    <div className="space-y-6">
                        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar size={72} icon={<UserOutlined />} src={profile?.avatar || undefined} />
                                    <div>
                                        <div className="text-2xl font-semibold text-slate-900">
                                            {profile?.nickname ?? "未命名用户"}
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                            <MailOutlined />
                                            {profile?.email ?? "--"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Tag color="orange">{role ? roleLabelMap[role] : "未知角色"}</Tag>
                                    <Button shape="round" className="border-slate-200 text-slate-700 shadow-none">
                                        编辑资料
                                    </Button>
                                </div>
                            </div>
                            <Divider className="my-6! border-slate-200!" />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">手机号</div>
                                    <div className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-900">
                                        <PhoneOutlined className="text-slate-400" />
                                        {profile?.phone || "未填写"}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">账号状态</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">
                                        {profile?.is_active ? "正常" : "已禁用"}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">注册时间</div>
                                    <div className="mt-2 text-base font-semibold text-slate-900">{profile?.created_at ?? "--"}</div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">
                                        账号安全
                                    </div>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">安全设置</h2>
                                </div>
                                <Tag color="blue">中等</Tag>
                            </div>
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <SafetyOutlined className="text-lg text-orange-500" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">登录密码</div>
                                            <div className="text-xs text-slate-500">建议定期修改密码提升安全性</div>
                                        </div>
                                    </div>
                                    <Button type="link">修改</Button>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <MailOutlined className="text-lg text-orange-500" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">邮箱绑定</div>
                                            <div className="text-xs text-slate-500">{profile?.email ?? "未设置邮箱"}</div>
                                        </div>
                                    </div>
                                    <Tag color={profile?.email ? "green" : "default"}>
                                        {profile?.email ? "已绑定" : "未设置"}
                                    </Tag>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <PhoneOutlined className="text-lg text-orange-500" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">手机绑定</div>
                                            <div className="text-xs text-slate-500">{profile?.phone || "未设置手机号"}</div>
                                        </div>
                                    </div>
                                    <Tag color={profile?.phone ? "green" : "default"}>
                                        {profile?.phone ? "已绑定" : "未设置"}
                                    </Tag>
                                </div>
                            </div>
                        </section>

                        {role === "landlord" ? (
                            <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">
                                        房源概览
                                    </div>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">我的房源</h2>
                                </div>
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {(houseQuery.data?.data?.items ?? []).map((item) => (
                                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="text-sm font-semibold text-slate-900">{item.address_summary}</div>
                                            <div className="mt-2 text-xs text-slate-500">{item.layout} · {item.area}㎡</div>
                                            <div className="mt-4 text-lg font-semibold text-orange-500">¥{item.monthly_rent}</div>
                                        </div>
                                    ))}
                                    {!houseQuery.isLoading && (houseQuery.data?.data?.items?.length ?? 0) === 0 ? (
                                        <div className="col-span-full text-center text-sm text-slate-500">暂无房源记录</div>
                                    ) : null}
                                </div>
                            </section>
                        ) : (
                            <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                                <div>
                                    <div className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">租住信息</div>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">我的合同</h2>
                                </div>
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {(contractsQuery.data?.data?.items ?? []).map((item) => (
                                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="text-sm font-semibold text-slate-900">{item.house_address}</div>
                                            <div className="mt-2 text-xs text-slate-500">{item.house_layout} · {item.house_area}㎡</div>
                                            <div className="mt-3 text-xs text-slate-500">
                                                租期：{item.start_date} ~ {item.end_date}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-sm font-semibold text-orange-500">¥{item.monthly_rent}/月</span>
                                                <Tag color="blue">{item.status_label}</Tag>
                                            </div>
                                        </div>
                                    ))}
                                    {!contractsQuery.isLoading && (contractsQuery.data?.data?.items?.length ?? 0) === 0 ? (
                                        <div className="col-span-full text-center text-sm text-slate-500">暂无合同记录</div>
                                    ) : null}
                                </div>
                            </section>
                        )}

                        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div>
                                <div className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">租金记录</div>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">本期账单</h2>
                            </div>
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {(rentQuery.data?.data?.items ?? []).map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-sm font-semibold text-slate-900">{item.month}</div>
                                        <div className="mt-2 text-xs text-slate-500">状态：{item.status_label}</div>
                                        <div className="mt-3 text-lg font-semibold text-orange-500">¥{item.amount}</div>
                                        <div className="mt-2 text-xs text-slate-400">付款时间：{item.paid_at || "未支付"}</div>
                                    </div>
                                ))}
                                {!rentQuery.isLoading && (rentQuery.data?.data?.items?.length ?? 0) === 0 ? (
                                    <div className="col-span-full text-center text-sm text-slate-500">暂无租金记录</div>
                                ) : null}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
