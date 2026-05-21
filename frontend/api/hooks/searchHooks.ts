import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type { ApiResponse, DecorationType, HouseType, SearchResult } from '..';
import { rent } from '../instance';

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

type SearchResponse = ApiResponse & {
    data?: SearchResult;
};

const searchKeys = {
    all: ['search'] as const,
    houses: (params?: SearchParams) => [...searchKeys.all, 'houses', params ?? {}] as const,
};

export const useSearchHouses = (
    params?: SearchParams,
    options?: UseQueryOptions<SearchResponse, ApiError>
) => {
    return useQuery({
        queryKey: searchKeys.houses(params),
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
        ...options,
    });
};

export { searchKeys };
