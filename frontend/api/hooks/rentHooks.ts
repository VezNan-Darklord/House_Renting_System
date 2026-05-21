import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type {
    ApiResponse,
    ConfirmPaymentRequest,
    PaginatedResponse,
    RemindPaymentRequest,
    RentRecord,
} from '..';
import { rent } from '../instance';

type RentRecordsParams = {
    contractId?: number;
    page?: number;
    pageSize?: number;
};

type RentRecordsResponse = ApiResponse & {
    data?: PaginatedResponse & {
        items: Array<RentRecord>;
    };
};

type RentRecordResponse = ApiResponse & {
    data?: RentRecord;
};

const rentKeys = {
    all: ['rent'] as const,
    records: (params?: RentRecordsParams) => [...rentKeys.all, 'records', params ?? {}] as const,
};

export const useRentRecords = (
    params?: RentRecordsParams,
    options?: UseQueryOptions<RentRecordsResponse, ApiError>
) => {
    return useQuery({
        queryKey: rentKeys.records(params),
        queryFn: () => rent.rent.getRentRecords(params?.contractId, params?.page, params?.pageSize),
        ...options,
    });
};

export const useConfirmPayment = (
    options?: UseMutationOptions<RentRecordResponse, ApiError, ConfirmPaymentRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.rent.confirmPayment(payload),
        ...options,
    });
};

export const useRemindPayment = (
    options?: UseMutationOptions<ApiResponse, ApiError, RemindPaymentRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.rent.remindPayment(payload),
        ...options,
    });
};

export { rentKeys };
