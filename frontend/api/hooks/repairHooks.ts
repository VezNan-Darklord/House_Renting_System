import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type {
    ApiResponse,
    PaginatedResponse,
    RepairRecord,
    RepairRequest,
    RepairStatus,
    UpdateRepairStatusRequest,
} from '..';
import { rent } from '../instance';

type RepairListParams = {
    page?: number;
    pageSize?: number;
    status?: RepairStatus;
};

type RepairListResponse = ApiResponse & {
    data?: PaginatedResponse & {
        items: Array<RepairRecord>;
    };
};

type RepairDetailResponse = ApiResponse & {
    data?: RepairRecord;
};

type UpdateRepairPayload = {
    repairId: number;
    data: UpdateRepairStatusRequest;
};

const repairKeys = {
    all: ['repair'] as const,
    list: (params?: RepairListParams) => [...repairKeys.all, 'list', params ?? {}] as const,
    detail: (repairId?: number) => [...repairKeys.all, 'detail', repairId ?? null] as const,
};

export const useRepairList = (
    params?: RepairListParams,
    options?: UseQueryOptions<RepairListResponse, ApiError>
) => {
    return useQuery({
        queryKey: repairKeys.list(params),
        queryFn: () => rent.repair.getRepairList(params?.page, params?.pageSize, params?.status),
        ...options,
    });
};

export const useRepairDetail = (
    repairId?: number,
    options?: UseQueryOptions<RepairDetailResponse, ApiError>
) => {
    return useQuery({
        queryKey: repairKeys.detail(repairId),
        queryFn: () => rent.repair.getRepairDetail(repairId as number),
        enabled: Boolean(repairId) && (options?.enabled ?? true),
        ...options,
    });
};

export const useCreateRepair = (
    options?: UseMutationOptions<RepairDetailResponse, ApiError, RepairRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.repair.createRepair(payload),
        ...options,
    });
};

export const useUpdateRepairStatus = (
    options?: UseMutationOptions<RepairDetailResponse, ApiError, UpdateRepairPayload>
) => {
    return useMutation({
        mutationFn: ({ repairId, data }) => rent.repair.updateRepairStatus(repairId, data),
        ...options,
    });
};

export { repairKeys };
