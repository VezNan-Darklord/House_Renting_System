/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminResetPasswordRequest } from '../models/AdminResetPasswordRequest';
import type { ApiResponse } from '../models/ApiResponse';
import type { LogRecord } from '../models/LogRecord';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { User } from '../models/User';
import type { UserRole } from '../models/UserRole';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AdminService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * 获取用户列表（管理员）
     * @param page
     * @param pageSize
     * @param role
     * @returns any 成功
     * @throws ApiError
     */
    public getUsers(
        page?: number,
        pageSize?: number,
        role?: UserRole,
    ): CancelablePromise<(ApiResponse & {
        data?: (PaginatedResponse & {
            items: Array<User>;
        });
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/admin/users',
            query: {
                'page': page,
                'page_size': pageSize,
                'role': role,
            },
        });
    }
    /**
     * 重置用户密码（管理员）
     * @param requestBody
     * @returns ApiResponse 成功
     * @throws ApiError
     */
    public resetPassword(
        requestBody: AdminResetPasswordRequest,
    ): CancelablePromise<ApiResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/admin/reset-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 查询系统日志（管理员）
     * @param page
     * @param pageSize
     * @param startDate
     * @param endDate
     * @param userId
     * @returns any 成功
     * @throws ApiError
     */
    public getLogs(
        page?: number,
        pageSize?: number,
        startDate?: string,
        endDate?: string,
        userId?: number,
    ): CancelablePromise<(ApiResponse & {
        data?: (PaginatedResponse & {
            items: Array<LogRecord>;
        });
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/admin/logs',
            query: {
                'page': page,
                'page_size': pageSize,
                'start_date': startDate,
                'end_date': endDate,
                'user_id': userId,
            },
        });
    }
}
