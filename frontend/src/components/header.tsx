import { HomeOutlined, StarOutlined, BellOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Badge, Input } from "antd";

export default function Header() {
    return (
        <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex h-50 w-full max-w-400 items-center px-4 sm:px-6 lg:px-8">
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
                            <Button type="text" icon={<StarOutlined />} className="text-slate-700!">
                                收藏
                            </Button>
                            <Badge count={3} size="small">
                                <Button type="text" icon={<BellOutlined />} className="text-slate-700!">
                                    消息
                                </Button>
                            </Badge>
                            <Button type="primary" shape="round" className="bg-slate-900! shadow-none!">
                                发布房源
                            </Button>
                        </div>
                    </div>

                    <div
                        className={`mx-auto w-full max-w-5xl transition-all duration-300 relative translate-x-0 px-0`}
                    >
                        <div className={`rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_25px_80px_rgba(15,23,42,0.12)]`}>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="flex-1 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="mb-1 text-xs font-medium text-slate-500">搜索关键词</div>
                                    <Input
                                        variant="borderless"
                                        prefix={<SearchOutlined className="text-slate-400" />}
                                        placeholder="请输入城市、小区、地铁站或房源关键词"
                                        className="px-0! text-base!"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 lg:w-90 lg:grid-cols-3">
                                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-xs font-medium text-slate-500">城市</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">杭州</div>
                                    </div>
                                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-xs font-medium text-slate-500">租金</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">不限</div>
                                    </div>
                                    <Button size="large" shape="round" type="primary" className="h-full min-h-16 bg-orange-500! font-semibold! shadow-none!">
                                        搜索
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {['地铁房', '近商圈', '整租', '合租', '可短租', '拎包入住', '朝南', '精装'].map((item) => (
                                    <Button key={item} shape="round" className="border-slate-200 text-slate-600 shadow-none">
                                        {item}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}