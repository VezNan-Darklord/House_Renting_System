import { HomeOutlined, StarOutlined, BellOutlined, SearchOutlined, AppstoreOutlined, HeartOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons"
import { Button, Badge, Input, Tooltip, Divider } from "antd"
import { useState, useEffect } from "react"

export default function App() {
    const [isSticky, setIsSticky] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY >= 200)
        }

        handleScroll()
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-[#faf7f2] text-slate-900">
            <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex h-50 w-full max-w-400 items-center px-4 sm:px-6 lg:px-8">
                    <div className="flex w-full flex-col gap-6">
                        <div className="flex items-center justify-between gap-4">
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
                            className={`mx-auto w-full max-w-5xl transition-all duration-300 ${isSticky ? 'fixed left-1/2 top-4 z-50 -translate-x-1/2 px-4' : 'relative translate-x-0 px-0'}`}
                        >
                            <div className={`rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_25px_80px_rgba(15,23,42,0.12)] ${isSticky ? 'ring-1 ring-black/5' : ''}`}>
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

                        <div className={`pt-1 text-sm text-slate-500 transition-opacity duration-300 ${isSticky ? 'opacity-0' : 'opacity-100'}`}>
                            搜索框滚动后会吸顶固定，下面的首页内容保持继续浏览。
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                <section className="mb-10">
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">推荐板块</div>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">为你整理的租房首页</h2>
                        </div>
                        <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
                            <AppstoreOutlined />
                            <span>响应式瀑布流布局</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 16 }).map((_, index) => (
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
                        ))}
                    </div>
                </section>

                <section className="mb-10 rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">首页补充区</div>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">后续可继续扩展的功能模块位置</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['热门小区', '通勤优先', '预算优先', '新房推荐'].map((item) => (
                                <Button key={item} shape="round" className="border-slate-200 text-slate-600 shadow-none">
                                    {item}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                                <div className="mb-4 h-36 rounded-[20px] border border-dashed border-slate-300 bg-white" />
                                <div className="h-4 w-2/3 rounded-full bg-slate-200" />
                                <div className="mt-3 h-3 w-full rounded-full bg-slate-200/80" />
                                <div className="mt-2 h-3 w-5/6 rounded-full bg-slate-200/80" />
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="h-4 w-24 rounded-full bg-slate-200" />
                                    <div className="h-9 w-24 rounded-full border border-slate-200 bg-white" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="rounded-4xl border border-slate-200 bg-slate-900 px-6 py-8 text-slate-100 shadow-[0_10px_40px_rgba(15,23,42,0.1)] sm:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                                    <ShopOutlined />
                                </div>
                                <div>
                                    <div className="text-lg font-semibold">House Flow</div>
                                    <div className="text-sm text-slate-400">前端首页占位壳，后续接入真实业务接口</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {['房源', '租客', '房东', '管理'].map((item) => (
                                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </footer>
            </main>

            <aside className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
                <div className="flex w-20 flex-col items-center gap-2 rounded-[28px] border border-slate-200 bg-white/95 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                    {[
                        { icon: <UserOutlined />, label: '我的' },
                        { icon: <HeartOutlined />, label: '收藏' },
                        { icon: <BellOutlined />, label: '消息' },
                        { icon: <StarOutlined />, label: '推荐' },
                        { icon: <AppstoreOutlined />, label: '分类' },
                    ].map((item) => (
                        <Button
                            key={item.label}
                            type="text"
                            className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-[18px] px-0! text-slate-600 shadow-none hover:bg-orange-50! hover:text-orange-500!"
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </Button>
                    ))}
                    <Divider className="my-1! border-slate-200!" />
                    <Button type="primary" shape="round" className="w-full bg-orange-500! shadow-none!">
                        反馈
                    </Button>
                </div>
            </aside>
        </div>
    )
}