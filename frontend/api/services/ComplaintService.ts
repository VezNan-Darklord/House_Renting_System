/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { ComplaintRecord } from '../models/ComplaintRecord';
import type { ComplaintRequest } from '../models/ComplaintRequest';
import type { ComplaintStatus } from '../models/ComplaintStatus';
import type { HandleComplaintRequest } from '../models/HandleComplaintRequest';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ComplaintService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * 提交投诉
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public createComplaint(
        requestBody: ComplaintRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: ComplaintRecord;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/complaint',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取投诉列表
     * @param page
     * @param pageSize
     * @param status
     * @returns any 成功
     * @throws ApiError
     */
    public getComplaintList(
        page?: number,
        pageSize?: number,
        status?: ComplaintStatus,
    ): CancelablePromise<(ApiResponse & {
        data?: (PaginatedResponse & {
            items: Array<ComplaintRecord>;
        });
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/complaint/list',
            query: {
                'page': page,
                'page_size': pageSize,
                'status': status,
            },
        });
    }
    /**
     * 处理投诉（管理员）
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public handleComplaint(
        requestBody: HandleComplaintRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: ComplaintRecord;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/complaint/handle',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
