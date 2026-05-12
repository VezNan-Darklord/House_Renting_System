import { HeartOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip } from "antd";

export default function HouseCard({ index }: { index: number }) { 
    return (
        <article
            key={index}
            className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1"
        >
            <div className="relative aspect-4/3 border-b border-dashed border-slate-200 bg-linear-to-br from-orange-100 via-white to-slate-100">
                <div className="absolute inset-4 rounded-3xl border border-dashed border-slate-300/80 bg-white/50" />
                <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-black/70 px-3 py-1 text-xs font-medium text-white">
                    占位房源 {index + 1}
                </div>
                <div className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10">
                    {index % 2 === 0 ? '整租' : '合租'}
                </div>
            </div>

            <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-900">
                            城市核心区域的优质房源占位标题，用于后续接入真实数据
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">地铁近 · 商圈近 · 可看房 · 真实图片后续接入</p>
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
                        <div className="mt-1 text-2xl font-semibold tracking-tight text-orange-500">¥{index * 300 + 2200}</div>
                    </div>
                    <Button shape="round" className="border-slate-200 text-slate-700 shadow-none">
                        查看占位
                    </Button>
                </div>
            </div>
        </article>
    )
}