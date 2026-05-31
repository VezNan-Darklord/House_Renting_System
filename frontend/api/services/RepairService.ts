/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { RepairRecord } from '../models/RepairRecord';
import type { RepairRequest } from '../models/RepairRequest';
import type { RepairStatus } from '../models/RepairStatus';
import type { UpdateRepairStatusRequest } from '../models/UpdateRepairStatusRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class RepairService {
    public readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * 提交维修申请
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public createRepair(
        requestBody: RepairRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: RepairRecord;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/repair',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取维修工单列表
     * @param page
     * @param pageSize
     * @param status
     * @returns any 成功
     * @throws ApiError
     */
    public getRepairList(
        page?: number,
        pageSize?: number,
        status?: RepairStatus,
    ): CancelablePromise<(ApiResponse & {
        data?: (PaginatedResponse & {
            items: Array<RepairRecord>;
        });
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/repair/list',
            query: {
                'page': page,
                'page_size': pageSize,
                'status': status,
            },
        });
    }
    /**
     * 获取维修工单详情
     * @param repairId
     * @returns any 成功
     * @throws ApiError
     */
    public getRepairDetail(
        repairId: number,
    ): CancelablePromise<(ApiResponse & {
        data?: RepairRecord;
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/repair/{repair_id}',
            path: {
                'repair_id': repairId,
            },
        });
    }
    /**
     * 更新维修状态
     * @param repairId
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public updateRepairStatus(
        repairId: number,
        requestBody: UpdateRepairStatusRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: RepairRecord;
    })> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/repair/{repair_id}/status',
            path: {
                'repair_id': repairId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
