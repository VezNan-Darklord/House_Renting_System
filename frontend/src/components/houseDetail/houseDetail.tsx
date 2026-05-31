import { Divider, Empty, Skeleton } from "antd";
import { useParams } from "react-router";
import { useHouseDetailQuery } from "../../../api/hooks/houseHooks";
import type { DecorationType, HouseStatus, HouseType } from "../../../api";
import Header from "../index/header";
import Sidebar from "../index/sidebar";

const houseTypeLabels: Record<HouseType, string> = {
    apartment: "公寓",
    residential: "住宅",
    villa: "别墅",
};

const decorationLabels: Record<DecorationType, string> = {
    luxury: "精装",
    simple: "简装",
    rough: "毛坯",
};

const statusLabels: Record<HouseStatus, string> = {
    vacant: "可租",
    rented: "已租",
    maintenance: "维护中",
};

const formatDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
};

const formatAddress = (parts: Array<string | undefined>) =>
    parts.filter((item) => item && item.trim().length > 0).join("");

export default function HouseDetail() {
    const { id } = useParams();
    const houseId = Number(id);
    const isHouseIdValid = Number.isFinite(houseId);
    const { data, isLoading, isError } = useHouseDetailQuery(
        isHouseIdValid ? houseId : undefined,
        isHouseIdValid
    );
    const house = data?.data;

    const addressLine = house
        ? formatAddress([house.address_province, house.address_city, house.address_district])
        : "";
    const addressDetail = house ? formatAddress([house.address_detail]) : "";
    const fullAddress = formatAddress([addressLine, addressDetail]);
    const title = house?.layout
        ? `${house.layout}${fullAddress ? ` · ${fullAddress}` : ""}`
        : fullAddress || "房源详情";
    const rent = house?.monthly_rent;
    const deposit = house?.deposit;
    const statusLabel = house?.status ? statusLabels[house.status] : "";
    const imageList = house?.images ?? [];
    const heroImage = imageList[0];

    return (
        <div className="min-h-screen bg-[#faf7f2] text-slate-900">
            <Header />
            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-25 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                    <div className="text-xs font-medium uppercase tracking-[0.35em] text-orange-500">
                        房源详情
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">{addressLine || "房源信息"}</div>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                        {house?.created_at ? (
                            <div className="mt-2 text-sm text-slate-400">{formatDate(house.created_at)}</div>
                        ) : null}
                    </div>

                    {isLoading ? (
                        <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                            <Skeleton active paragraph={{ rows: 8 }} />
                        </div>
                    ) : null}

                    {!isLoading && (isError || !house) ? (
                        <div className="rounded-[28px] border border-white/70 bg-white p-10 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                            <Empty description={isHouseIdValid ? "未找到房源信息" : "房源编号无效"} />
                        </div>
                    ) : null}

                    {!isLoading && !isError && house ? (
                        <>
                            <section className="grid gap-6 lg:grid-cols-[2fr_1.2fr]">
                                <div className="space-y-4">
                                    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
                                        {heroImage ? (
                                            <img
                                                src={heroImage}
                                                alt={`房源 ${house.id ?? ""}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-90 items-center justify-center text-sm text-slate-400">
                                                暂无房源图片
                                            </div>
                                        )}
                                    </div>
                                    {imageList.length > 1 ? (
                                        <div className="grid grid-cols-5 gap-3">
                                            {imageList.slice(0, 5).map((url, index) => (
                                                <div
                                                    key={`${url}-${index}`}
                                                    className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100"
                                                >
                                                    <img src={url} alt={`房源图片 ${index + 1}`} className="h-20 w-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                                        <div className="flex items-end gap-3">
                                            <div className="text-4xl font-semibold text-orange-500">
                                                {rent ? `¥${rent}` : "价格面议"}
                                            </div>
                                            <div className="text-sm text-slate-500">元/月</div>
                                            {statusLabel ? (
                                                <span className="ml-auto rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                                                    {statusLabel}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="mt-6 space-y-3 text-sm text-slate-600">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">房屋类型</span>
                                                <span className="font-medium text-slate-900">
                                                    {house.house_type ? houseTypeLabels[house.house_type] : "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">户型</span>
                                                <span className="font-medium text-slate-900">{house.layout ?? "-"}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">建筑面积</span>
                                                <span className="font-medium text-slate-900">
                                                    {house.area ? `${house.area} ㎡` : "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">装修情况</span>
                                                <span className="font-medium text-slate-900">
                                                    {house.decoration ? decorationLabels[house.decoration] : "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">押金</span>
                                                <span className="font-medium text-slate-900">
                                                    {deposit !== undefined ? `¥${deposit}` : "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">详细地址</span>
                                                <span className="text-right font-medium text-slate-900">
                                                    {fullAddress || "-"}
                                                </span>
                                            </div>
                                        </div>

                                        <Divider className="my-6! border-slate-200!" />

                                        <div>
                                            <div className="text-sm font-medium text-slate-600">配套设施</div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {house.facilities && house.facilities.length > 0 ? (
                                                    house.facilities.map((item) => (
                                                        <span
                                                            key={item}
                                                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-slate-400">暂无配套信息</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-xs font-medium uppercase tracking-[0.3em] text-orange-500">
                                            房东信息
                                        </div>
                                        <div className="mt-3 text-lg font-semibold text-slate-900">
                                            {house.landlord_nickname ?? "房东"}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-500">
                                            房东编号：{house.landlord_id ?? "-"}
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">房源编号：{house.id ?? "-"}</div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                                <div className="text-lg font-semibold text-slate-900">房源详情</div>
                                <p className="mt-4 text-sm leading-6 text-slate-600">
                                    {house.description || "暂无房源描述"}
                                </p>
                            </section>
                        </>
                    ) : null}
                </div>
            </main>
            <Sidebar />
        </div>
    );
}
