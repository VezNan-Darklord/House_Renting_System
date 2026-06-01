import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Avatar, Tag, Button, Divider, Form, Input, message } from "antd";
import PopWindow from "../common/PopWindow";
import { useContractListQuery } from "../../../api/hooks/contractHooks";
import { useHouseListQuery } from "../../../api/hooks/houseHooks";
import { useRentRecordsQuery } from "../../../api/hooks/rentHooks";
import { useUserContext } from "../userContext";
import { useProfileQuery, useUpdateProfileMutation } from "../../../api/hooks/userHooks";
import { useEffect, useState } from "react";
import type { UpdateProfileRequest } from "../../../api";

const roleLabelMap: Record<string, string> = {
    tenant: "租客",
    landlord: "房东",
    admin: "管理员",
};

export default function AccountInfo() { 
    const { isLoggedIn } = useUserContext();

    const profileQuery = useProfileQuery(isLoggedIn);
    const profile = profileQuery.data?.data;
    const role = profile?.role;
    const updateProfileMutation = useUpdateProfileMutation();
    const contractsQuery = useContractListQuery({ page: 1, pageSize: 6 }, isLoggedIn);
    const rentQuery = useRentRecordsQuery({ page: 1, pageSize: 6 }, isLoggedIn);
    const houseQuery = useHouseListQuery({ page: 1, pageSize: 6 }, isLoggedIn && role === "landlord");

    const [editOpen, setEditOpen] = useState(false);

    const [editForm] = Form.useForm<UpdateProfileRequest>();

    useEffect(() => {
        if (!profile) return;
        editForm.setFieldsValue({
            nickname: profile.nickname ?? "",
            phone: profile.phone ?? "",
            avatar: profile.avatar ?? "",
        });
    }, [editForm, profile]);
    
    return (
        <>
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
                            <Button
                                shape="round"
                                className="border-slate-200 text-slate-700 shadow-none"
                                onClick={() => setEditOpen(true)}
                            >
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
            <PopWindow open={editOpen} title="编辑个人信息" onClose={() => setEditOpen(false)}>
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={async (values) => {
                        try {
                            await updateProfileMutation.mutateAsync(values);
                            message.success("个人信息已更新");
                            setEditOpen(false);
                            profileQuery.refetch();
                        } catch (error) {
                            message.error(error instanceof Error ? error.message : "更新失败");
                        }
                    }}
                >
                    <Form.Item label="昵称" name="nickname">
                        <Input placeholder="请输入昵称" />
                    </Form.Item>
                    <Form.Item label="手机号" name="phone">
                        <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item label="头像地址" name="avatar">
                        <Input placeholder="请输入头像图片地址" />
                    </Form.Item>
                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setEditOpen(false)}>取消</Button>
                        <Button type="primary" className="bg-slate-900! shadow-none!" loading={updateProfileMutation.isPending} htmlType="submit">
                            保存
                        </Button>
                    </div>
                </Form>
            </PopWindow>
        </>
    )
}