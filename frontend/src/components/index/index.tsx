import HouseCard from "./houseCard";
import { useHouseListQuery } from "../../../api/hooks/houseHooks";
import { useSearchHousesQuery } from "../../../api/hooks/searchHooks";
import { DownOutlined, SearchOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Select } from "antd";
import Sidebar from "./sidebar";
import Header from "./header";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DecorationType, HouseType } from "../../../api";
import type { DefaultOptionType } from "antd/es/select";
import { getRegionData } from "region-data";

type RegionNode = {
    name: string;
    code: number;
    children: RegionNode[];
};

type SearchFilters = {
    keyword?: string;
    layout?: string;
    province?: string;
    city?: string;
    district?: string;
    minRent?: number;
    maxRent?: number;
    minArea?: number;
    maxArea?: number;
    houseType?: HouseType;
    decoration?: DecorationType;
};

const houseTypeOptions: DefaultOptionType[] = [
    { label: "公寓", value: "apartment" },
    { label: "住宅", value: "residential" },
    { label: "别墅", value: "villa" },
];

const decorationOptions: DefaultOptionType[] = [
    { label: "精装", value: "luxury" },
    { label: "简装", value: "simple" },
    { label: "毛坯", value: "rough" },
];

export default function Index() {  
    const [draftFilters, setDraftFilters] = useState<SearchFilters>({});
    const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
    const [isExpanded, setIsExpanded] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const regionData = useMemo<RegionNode[]>(() => getRegionData(), []);
    const provinceOptions = useMemo(
        () => regionData.map((province) => ({ label: province.name, value: province.name })),
        [regionData]
    );
    const selectedProvince = useMemo(
        () => regionData.find((province) => province.name === draftFilters.province),
        [regionData, draftFilters.province]
    );
    const cityNodes = useMemo(() => selectedProvince?.children ?? [], [selectedProvince]);
    const cityOptions = useMemo(
        () => cityNodes.map((city) => ({ label: city.name, value: city.name })),
        [cityNodes]
    );
    const selectedCity = useMemo(
        () => cityNodes.find((city) => city.name === draftFilters.city),
        [cityNodes, draftFilters.city]
    );
    const districtNodes = useMemo(() => {
        if (!selectedProvince) return [];
        const sourceCity = selectedCity ?? (cityNodes.length === 1 ? cityNodes[0] : undefined);
        return sourceCity?.children ?? [];
    }, [selectedProvince, selectedCity, cityNodes]);
    const districtOptions = useMemo(
        () => districtNodes.map((district) => ({ label: district.name, value: district.name })),
        [districtNodes]
    );
    const isCityDisabled = !selectedProvince || cityNodes.length === 1;
    const isDistrictDisabled =
        !selectedProvince || (cityNodes.length > 1 && !selectedCity) || districtOptions.length === 0;
    const cityPlaceholder = !selectedProvince
        ? "请先选择省份"
        : cityNodes.length === 1
          ? "直辖市无需选择"
          : "例如：杭州";
    const districtPlaceholder = !selectedProvince
        ? "请先选择省份"
        : cityNodes.length > 1 && !selectedCity
          ? "请先选择城市"
          : "例如：西湖区";

    const isSearching = useMemo(() => Object.keys(activeFilters).length > 0, [activeFilters]);
    const searchParams = useMemo(
        () => ({ page: 1, pageSize: 12, ...activeFilters }),
        [activeFilters]
    );

    const { data: listData, isLoading: listLoading, isError: listError } = useHouseListQuery(
        { page: 1, pageSize: 12 },
        !isSearching
    );
    const { data: searchData, isLoading: searchLoading, isError: searchError } = useSearchHousesQuery(
        searchParams,
        isSearching
    );

    const items = isSearching ? searchData?.data?.items ?? [] : listData?.data?.items ?? [];
    const isLoading = isSearching ? searchLoading : listLoading;
    const isError = isSearching ? searchError : listError;

    const normalizeFilters = (filters: SearchFilters) => {
        const normalized: SearchFilters = {};
        if (filters.keyword?.trim()) normalized.keyword = filters.keyword.trim();
        if (filters.layout?.trim()) normalized.layout = filters.layout.trim();
        if (filters.province?.trim()) normalized.province = filters.province.trim();
        if (filters.city?.trim()) normalized.city = filters.city.trim();
        if (filters.district?.trim()) normalized.district = filters.district.trim();
        if (filters.minRent !== undefined && filters.minRent !== null) {
            normalized.minRent = filters.minRent;
        }
        if (filters.maxRent !== undefined && filters.maxRent !== null) {
            normalized.maxRent = filters.maxRent;
        }
        if (filters.minArea !== undefined && filters.minArea !== null) {
            normalized.minArea = filters.minArea;
        }
        if (filters.maxArea !== undefined && filters.maxArea !== null) {
            normalized.maxArea = filters.maxArea;
        }
        if (filters.houseType) normalized.houseType = filters.houseType;
        if (filters.decoration) normalized.decoration = filters.decoration;
        return normalized;
    };

    const applySearch = (filters: SearchFilters) => {
        setActiveFilters(normalizeFilters(filters));
    };

    const scheduleSearch = (filters: SearchFilters) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            applySearch(filters);
        }, 1000);
    };

    const updateDraftFilters = (
        patch: Partial<SearchFilters>,
        options?: { debounce?: boolean; immediate?: boolean }
    ) => {
        setDraftFilters((prev) => {
            const next = { ...prev, ...patch };
            if (options?.debounce) {
                scheduleSearch(next);
            } else if (options?.immediate) {
                if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                    debounceRef.current = null;
                }
                applySearch(next);
            }
            return next;
        });
    };

    const handleSearch = () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        applySearch(draftFilters);
    };

    const handleSidebarFilter = (patch: Partial<SearchFilters>) => {
        updateDraftFilters(patch, { immediate: true });
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

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
                                    value={draftFilters.keyword ?? ""}
                                    onChange={(event) =>
                                        updateDraftFilters(
                                            { keyword: event.target.value },
                                            { debounce: true }
                                        )
                                    }
                                    onPressEnter={handleSearch}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="large"
                                    type="primary"
                                    className="h-full min-h-10 font-semibold! shadow-none!"
                                    onClick={handleSearch}
                                >
                                    搜索
                                </Button>
                                <Button
                                    size="large"
                                    type="default"
                                    className="h-full min-h-16 border-slate-200 font-medium! text-slate-600! border-none!"
                                    onClick={() => setIsExpanded((prev) => !prev)}
                                >
                                    {isExpanded ? <UpOutlined /> : <DownOutlined />}
                                </Button>
                            </div>
                        </div>
                        {isExpanded ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">户型</div>
                                <Input
                                    variant="borderless"
                                    placeholder="例如：2室1厅"
                                    value={draftFilters.layout ?? ""}
                                    onChange={(event) =>
                                        updateDraftFilters(
                                            { layout: event.target.value },
                                            { debounce: true }
                                        )
                                    }
                                />
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">省份</div>
                                <Select
                                    options={provinceOptions}
                                    placeholder="例如：浙江省"
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    value={draftFilters.province}
                                    onChange={(value) => {
                                        const nextProvince = regionData.find(
                                            (province) => province.name === value
                                        );
                                        const nextCity =
                                            nextProvince?.children?.length === 1
                                                ? nextProvince.children[0].name
                                                : undefined;
                                        updateDraftFilters(
                                            {
                                                province: value,
                                                city: nextCity,
                                                district: undefined,
                                            },
                                            { immediate: true }
                                        );
                                    }}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toString().includes(input)
                                    }
                                />
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">城市</div>
                                <Select
                                    options={cityOptions}
                                    placeholder={cityPlaceholder}
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    value={draftFilters.city}
                                    disabled={isCityDisabled}
                                    onChange={(value) =>
                                        updateDraftFilters(
                                            {
                                                city: value,
                                                district: undefined,
                                            },
                                            { immediate: true }
                                        )
                                    }
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toString().includes(input)
                                    }
                                />
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">区/县</div>
                                <Select
                                    options={districtOptions}
                                    placeholder={districtPlaceholder}
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    value={draftFilters.district}
                                    disabled={isDistrictDisabled}
                                    onChange={(value) =>
                                        updateDraftFilters({ district: value }, { immediate: true })
                                    }
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toString().includes(input)
                                    }
                                />
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">房屋类型</div>
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="不限"
                                    optionFilterProp="label"
                                    options={houseTypeOptions}
                                    value={draftFilters.houseType}
                                    onChange={(value) =>
                                        updateDraftFilters({ houseType: value }, { immediate: true })
                                    }
                                />
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">装修情况</div>
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="不限"
                                    optionFilterProp="label"
                                    options={decorationOptions}
                                    value={draftFilters.decoration}
                                    onChange={(value) =>
                                        updateDraftFilters({ decoration: value }, { immediate: true })
                                    }
                                />
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">租金区间</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        placeholder="最低"
                                        value={draftFilters.minRent}
                                        onChange={(value) =>
                                            updateDraftFilters(
                                                { minRent: value ?? undefined },
                                                { immediate: true }
                                            )
                                        }
                                    />
                                    <span className="text-xs text-slate-400">-</span>
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        placeholder="最高"
                                        value={draftFilters.maxRent}
                                        onChange={(value) =>
                                            updateDraftFilters(
                                                { maxRent: value ?? undefined },
                                                { immediate: true }
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-medium text-slate-500">面积区间</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        placeholder="最小㎡"
                                        value={draftFilters.minArea}
                                        onChange={(value) =>
                                            updateDraftFilters(
                                                { minArea: value ?? undefined },
                                                { immediate: true }
                                            )
                                        }
                                    />
                                    <span className="text-xs text-slate-400">-</span>
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        placeholder="最大㎡"
                                        value={draftFilters.maxArea}
                                        onChange={(value) =>
                                            updateDraftFilters(
                                                { maxArea: value ?? undefined },
                                                { immediate: true }
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        ) : null}
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
            <Sidebar
                activeFilters={{
                    minRent: draftFilters.minRent,
                    maxRent: draftFilters.maxRent,
                    minArea: draftFilters.minArea,
                    maxArea: draftFilters.maxArea,
                }}
                onFilter={handleSidebarFilter}
            />
        </div>
    )
}
