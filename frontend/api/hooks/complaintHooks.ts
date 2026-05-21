import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type {
    ApiResponse,
    ComplaintRecord,
    ComplaintRequest,
    ComplaintStatus,
    HandleComplaintRequest,
    PaginatedResponse,
} from '..';
import { rent } from '../instance';

type ComplaintListParams = {
    page?: number;
    pageSize?: number;
    status?: ComplaintStatus;
};

type ComplaintListResponse = ApiResponse & {
    data?: PaginatedResponse & {
        items: Array<ComplaintRecord>;
    };
};

type ComplaintResponse = ApiResponse & {
    data?: ComplaintRecord;
};

const complaintKeys = {
    all: ['complaint'] as const,
    list: (params?: ComplaintListParams) => [...complaintKeys.all, 'list', params ?? {}] as const,
};

export const useComplaintList = (
    params?: ComplaintListParams,
    options?: UseQueryOptions<ComplaintListResponse, ApiError>
) => {
    return useQuery({
        queryKey: complaintKeys.list(params),
        queryFn: () => rent.complaint.getComplaintList(params?.page, params?.pageSize, params?.status),
        ...options,
    });
};

export const useCreateComplaint = (
    options?: UseMutationOptions<ComplaintResponse, ApiError, ComplaintRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.complaint.createComplaint(payload),
        ...options,
    });
};

export const useHandleComplaint = (
    options?: UseMutationOptions<ComplaintResponse, ApiError, HandleComplaintRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.complaint.handleComplaint(payload),
        ...options,
    });
};

export { complaintKeys };
