import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type {
    ApiResponse,
    House,
    HouseListItem,
    HouseRequest,
    HouseStatus,
    PaginatedResponse,
    UpdateHouseStatusRequest,
    UploadHouseImagesRequest,
} from '..';
import { rent } from '../instance';

type HouseListParams = {
    page?: number;
    pageSize?: number;
    status?: HouseStatus;
};

type HouseListResponse = ApiResponse & {
    data?: PaginatedResponse & {
        items: Array<HouseListItem>;
    };
};

type HouseDetailResponse = ApiResponse & {
    data?: House;
};

type UpdateHousePayload = {
    houseId: number;
    data: HouseRequest;
};

type UpdateHouseStatusPayload = {
    houseId: number;
    data: UpdateHouseStatusRequest;
};

type UploadHouseImagesResponse = ApiResponse & {
    data?: {
        urls: Array<string>;
    };
};

const houseKeys = {
    all: ['house'] as const,
    list: (params?: HouseListParams) => [...houseKeys.all, 'list', params ?? {}] as const,
    detail: (houseId?: number) => [...houseKeys.all, 'detail', houseId ?? null] as const,
};

export const useHouseList = (
    params?: HouseListParams,
    options?: UseQueryOptions<HouseListResponse, ApiError>
) => {
    return useQuery({
        queryKey: houseKeys.list(params),
        queryFn: () => rent.house.getHouseList(params?.page, params?.pageSize, params?.status),
        ...options,
    });
};

export const useHouseDetail = (
    houseId?: number,
    options?: UseQueryOptions<HouseDetailResponse, ApiError>
) => {
    return useQuery({
        queryKey: houseKeys.detail(houseId),
        queryFn: () => rent.house.getHouseDetail(houseId as number),
        enabled: Boolean(houseId) && (options?.enabled ?? true),
        ...options,
    });
};

export const useCreateHouse = (
    options?: UseMutationOptions<HouseDetailResponse, ApiError, HouseRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.house.createHouse(payload),
        ...options,
    });
};

export const useUpdateHouse = (
    options?: UseMutationOptions<HouseDetailResponse, ApiError, UpdateHousePayload>
) => {
    return useMutation({
        mutationFn: ({ houseId, data }) => rent.house.updateHouse(houseId, data),
        ...options,
    });
};

export const useDeleteHouse = (
    options?: UseMutationOptions<ApiResponse, ApiError, number>
) => {
    return useMutation({
        mutationFn: (houseId) => rent.house.deleteHouse(houseId),
        ...options,
    });
};

export const useUpdateHouseStatus = (
    options?: UseMutationOptions<HouseDetailResponse, ApiError, UpdateHouseStatusPayload>
) => {
    return useMutation({
        mutationFn: ({ houseId, data }) => rent.house.updateHouseStatus(houseId, data),
        ...options,
    });
};

export const useUploadHouseImages = (
    options?: UseMutationOptions<UploadHouseImagesResponse, ApiError, UploadHouseImagesRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.house.uploadImages(payload),
        ...options,
    });
};

export { houseKeys };
