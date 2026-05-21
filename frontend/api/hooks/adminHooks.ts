import { useMutation, useQuery } from "@tanstack/react-query";
import { rent } from "../instance";
import type { AdminResetPasswordRequest, UserRole } from "..";

type AdminUsersParams = {
    page?: number;
    pageSize?: number;
    role?: UserRole;
};

type AdminLogsParams = {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    userId?: number;
};

export function useAdminUsersQuery(params?: AdminUsersParams, enabled = true) {
    return useQuery({
        queryKey: ["adminUsers", params],
        queryFn: () => rent.admin.getUsers(params?.page, params?.pageSize, params?.role),
        enabled,
    });
}

export function useAdminLogsQuery(params?: AdminLogsParams, enabled = true) {
    return useQuery({
        queryKey: ["adminLogs", params],
        queryFn: () => rent.admin.getLogs(params?.page, params?.pageSize, params?.startDate, params?.endDate, params?.userId),
        enabled,
    });
}

export function useResetPasswordMutation() {
    return useMutation({
        mutationKey: ["adminResetPassword"],
        mutationFn: (data: AdminResetPasswordRequest) => rent.admin.resetPassword(data),
    });
}
