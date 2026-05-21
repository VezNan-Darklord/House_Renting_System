import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type {
    AdminResetPasswordRequest,
    ApiResponse,
    LogRecord,
    PaginatedResponse,
    User,
    UserRole,
} from '..';
import { rent } from '../instance';

type AdminUsersParams = {
    page?: number;
    pageSize?: number;
    role?: UserRole;
};

type AdminUsersResponse = ApiResponse & {
    data?: PaginatedResponse & {
        items: Array<User>;
    };
};

type AdminLogsParams = {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    userId?: number;
};

type AdminLogsResponse = ApiResponse & {
    data?: PaginatedResponse & {
        items: Array<LogRecord>;
    };
};

const adminKeys = {
    all: ['admin'] as const,
    users: (params?: AdminUsersParams) => [...adminKeys.all, 'users', params ?? {}] as const,
    logs: (params?: AdminLogsParams) => [...adminKeys.all, 'logs', params ?? {}] as const,
};

export const useAdminUsers = (
    params?: AdminUsersParams,
    options?: UseQueryOptions<AdminUsersResponse, ApiError>
) => {
    return useQuery({
        queryKey: adminKeys.users(params),
        queryFn: () => rent.admin.getUsers(params?.page, params?.pageSize, params?.role),
        ...options,
    });
};

export const useAdminLogs = (
    params?: AdminLogsParams,
    options?: UseQueryOptions<AdminLogsResponse, ApiError>
) => {
    return useQuery({
        queryKey: adminKeys.logs(params),
        queryFn: () =>
            rent.admin.getLogs(params?.page, params?.pageSize, params?.startDate, params?.endDate, params?.userId),
        ...options,
    });
};

export const useResetPassword = (
    options?: UseMutationOptions<ApiResponse, ApiError, AdminResetPasswordRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.admin.resetPassword(payload),
        ...options,
    });
};

export { adminKeys };
