import HouseCard from "./houseCard";

export default function Index() { 
    return (
        <div className="min-h-screen bg-[#faf7f2] text-slate-900">
            
            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
                <section className="mb-10">
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">推荐板块</div>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">为你整理的租房首页</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 16 }).map((_, index) => (
                            <HouseCard index={index} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}