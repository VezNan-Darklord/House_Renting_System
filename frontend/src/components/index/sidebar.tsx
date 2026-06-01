import { UserOutlined, BellOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";

type SidebarFilters = {
    minRent?: number;
    maxRent?: number;
    minArea?: number;
    maxArea?: number;
};

type SidebarProps = {
    activeFilters: SidebarFilters;
    onFilter: (filters: SidebarFilters) => void;
};

const rentOptions = [
    { label: "不限", minRent: undefined, maxRent: undefined },
    { label: "1500元以下", minRent: 0, maxRent: 1500 },
    { label: "1500-3000元", minRent: 1500, maxRent: 3000 },
    { label: "3000-5000元", minRent: 3000, maxRent: 5000 },
    { label: "5000元以上", minRent: 5000, maxRent: undefined },
];

const areaOptions = [
    { label: "不限", minArea: undefined, maxArea: undefined },
    { label: "30㎡以下", minArea: 0, maxArea: 30 },
    { label: "30-60㎡", minArea: 30, maxArea: 60 },
    { label: "60-90㎡", minArea: 60, maxArea: 90 },
    { label: "90㎡以上", minArea: 90, maxArea: undefined },
];

export default function Sidebar({ activeFilters, onFilter }: SidebarProps) {
    const navigate = useNavigate();
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const sidbarItems = [
        { icon: <UserOutlined />, label: '我的', onClick: () => navigate('/user') },
        { icon: <BellOutlined />, label: '消息', onClick: () => navigate('/chat') },
    ];

    return (
        <aside className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
            <div className="flex w-20 flex-col items-center gap-2 rounded-[28px] border border-slate-200 bg-white/95 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                    {sidbarItems.map((item) => (
                        <Button
                            key={item.label}
                            type="text"
                            className="flex h-16! w-full flex-col items-center justify-center gap-1 rounded-[18px] px-0! text-slate-600 shadow-none hover:bg-orange-50! hover:text-orange-500!"
                            onClick={item.onClick}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </Button>
                    ))}
                    <div
                        className="relative w-full"
                        onMouseEnter={() => setIsCategoryOpen(true)}
                        onMouseLeave={() => setIsCategoryOpen(false)}
                    >
                        <Button
                            type="text"
                            className="flex h-16! w-full flex-col items-center justify-center gap-1 rounded-[18px] px-0! text-slate-600 shadow-none hover:bg-orange-50! hover:text-orange-500!"
                        >
                            <span className="text-lg"><AppstoreOutlined /></span>
                            <span className="text-[11px] font-medium">分类</span>
                        </Button>
                        {isCategoryOpen ? (
                            <div
                                className="absolute right-full top-0 h-full w-3"
                                aria-hidden="true"
                            />
                        ) : null}
                        {isCategoryOpen ? (
                            <div className="absolute right-[calc(100%+12px)] top-1/2 w-60 -translate-y-1/2 rounded-[20px] border border-slate-200 bg-white p-4 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                                <div className="text-xs font-semibold text-slate-500">租金区间</div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {rentOptions.map((option) => {
                                        const isActive =
                                            activeFilters.minRent === option.minRent &&
                                            activeFilters.maxRent === option.maxRent;
                                        return (
                                            <button
                                                key={option.label}
                                                type="button"
                                                className={`rounded-xl border px-2 py-1 text-left text-xs transition ${
                                                    isActive
                                                        ? "border-orange-200 bg-orange-50 text-orange-500"
                                                        : "border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
                                                }`}
                                                onClick={() =>
                                                    onFilter({
                                                        minRent: option.minRent,
                                                        maxRent: option.maxRent,
                                                    })
                                                }
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 text-xs font-semibold text-slate-500">面积区间</div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {areaOptions.map((option) => {
                                        const isActive =
                                            activeFilters.minArea === option.minArea &&
                                            activeFilters.maxArea === option.maxArea;
                                        return (
                                            <button
                                                key={option.label}
                                                type="button"
                                                className={`rounded-xl border px-2 py-1 text-left text-xs transition ${
                                                    isActive
                                                        ? "border-orange-200 bg-orange-50 text-orange-500"
                                                        : "border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
                                                }`}
                                                onClick={() =>
                                                    onFilter({
                                                        minArea: option.minArea,
                                                        maxArea: option.maxArea,
                                                    })
                                                }
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
            </div>
        </aside>
    )    
}
