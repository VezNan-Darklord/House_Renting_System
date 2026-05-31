import { HeartOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip } from "antd";
import type { HouseListItem } from "../../../api";

type HouseCardProps = {
    index: number;
    item?: HouseListItem;
};

export default function HouseCard({ index, item }: HouseCardProps) {
    const title = item?.address_summary ?? "城市核心区域的优质房源";
    const subtitle = item?.layout
        ? `${item.layout} · ${item.area ? `${item.area}㎡` : "可看房"} · ${item.status_label ?? "真实房源"}`
        : "地铁近 · 商圈近 · 可看房 · 真实图片后续接入";
    const badgeText = item?.status_label ?? (index % 2 === 0 ? "整租" : "合租");
    const rent = item?.monthly_rent ?? index * 300 + 2200;
    const coverImage = item?.cover_image;

    const isBase64Image = coverImage && coverImage.startsWith('data:image');

    return (
        <article
            className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1"
        >
            <div
                className="relative aspect-4/3 border-b border-dashed border-slate-200 bg-linear-to-br from-orange-100 via-white to-slate-100"
                style={
                    coverImage
                        ? {
                              backgroundImage: isBase64Image
                                  ? `url(${coverImage})`
                                  : `url(${coverImage})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                          }
                        : undefined
                }
            >
                <div className="absolute inset-4 rounded-3xl border border-dashed border-slate-300/80 bg-white/50" />
                <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-black/70 px-3 py-1 text-xs font-medium text-white">
                    {item?.id ? `房源 ${item.id}` : `占位房源 ${index + 1}`}
                </div>
                <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10">
                    {badgeText}
                </div>
            </div>

            <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-900">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                    </div>
                    <Tooltip title="收藏">
                        <Button type="text" shape="circle" icon={<HeartOutlined />} className="shrink-0 text-slate-400 shadow-none" />
                    </Tooltip>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['南北通透', '电梯房', '近地铁'].map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                            {tag}
                        </span>
                    ))}
                </div>

                <Divider className="my-0! border-slate-200!" />

                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-medium text-slate-500">月租参考</div>
                        <div className="mt-1 text-2xl font-semibold tracking-tight text-orange-500">¥{rent}</div>
                    </div>
                    <Button shape="round" className="border-slate-200 text-slate-700 shadow-none">
                        查看详情
                    </Button>
                </div>
            </div>
        </article>
    )
}
