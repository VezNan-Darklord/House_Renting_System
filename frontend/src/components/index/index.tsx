import HouseCard from "./houseCard";
import { useHouseListQuery } from "../../../api/hooks/houseHooks";
import { useSearchHousesQuery } from "../../../api/hooks/searchHooks";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Button } from "antd";
import Sidebar from "./sidebar";
import Header from "./header";
import { useState } from "react";
 
export default function Index() { 
    const [keywordInput, setKeywordInput] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const isSearching = Boolean(searchKeyword);

    const { data: listData, isLoading: listLoading, isError: listError } = useHouseListQuery(
        { page: 1, pageSize: 12 },
        !isSearching
    );
    const { data: searchData, isLoading: searchLoading, isError: searchError } = useSearchHousesQuery(
        { page: 1, pageSize: 12, keyword: searchKeyword },
        isSearching
    );

    const items = isSearching ? searchData?.data?.items ?? [] : listData?.data?.items ?? [];
    const isLoading = isSearching ? searchLoading : listLoading;
    const isError = isSearching ? searchError : listError;

    const handleSearch = () => {
        setSearchKeyword(keywordInput.trim());
    };

    return (
        <div className="min-h-screen bg-[#faf7f2] text-slate-900">   
            <Header />
            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-25 sm:px-6 lg:px-8">
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
                                    value={keywordInput}
                                    onChange={(event) => setKeywordInput(event.target.value)}
                                    onPressEnter={handleSearch}
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
                                <Button
                                    size="large"
                                    shape="round"
                                    type="primary"
                                    className="h-full min-h-16 bg-orange-500! font-semibold! shadow-none!"
                                    onClick={handleSearch}
                                >
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
                <section className="mb-10">
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium uppercase tracking-[0.3em] text-orange-500">推荐板块</div>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">为你整理的租房首页</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {items.map((item, index) => (
                            <HouseCard key={item?.id ?? index} index={index} item={item} />
                        ))}
                    </div>
                    {!isLoading && !isError && items.length === 0 ? (
                        <div className="mt-6 text-center text-sm text-slate-500">
                            {isSearching ? "暂无搜索结果" : "暂无可浏览房源"}
                        </div>
                    ) : null}
                    {isError ? (
                        <div className="mt-6 text-center text-sm text-rose-500">房源加载失败，请稍后重试</div>
                    ) : null}
                </section>
            </main>
            <Sidebar />
        </div>
    )
}
