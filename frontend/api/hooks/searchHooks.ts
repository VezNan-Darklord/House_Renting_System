import { useQuery } from "@tanstack/react-query";
import { rent } from "../instance";
import type { DecorationType, HouseType } from "..";

type SearchParams = {
    page?: number;
    pageSize?: number;
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

export function useSearchHousesQuery(params?: SearchParams, enabled = true) {
    return useQuery({
        queryKey: ["searchHouses", params],
        queryFn: () =>
            rent.search.searchHouses(
                params?.page,
                params?.pageSize,
                params?.keyword,
                params?.layout,
                params?.province,
                params?.city,
                params?.district,
                params?.minRent,
                params?.maxRent,
                params?.minArea,
                params?.maxArea,
                params?.houseType,
                params?.decoration
            ),
        enabled,
    });
}
