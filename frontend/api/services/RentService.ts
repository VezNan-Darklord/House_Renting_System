/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { ConfirmPaymentRequest } from '../models/ConfirmPaymentRequest';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { RemindPaymentRequest } from '../models/RemindPaymentRequest';
import type { RentRecord } from '../models/RentRecord';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class RentService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * 获取租金记录列表
     * @param contractId
     * @param page
     * @param pageSize
     * @returns any 成功
     * @throws ApiError
     */
    public getRentRecords(
        contractId?: number,
        page?: number,
        pageSize?: number,
    ): CancelablePromise<(ApiResponse & {
        data?: (PaginatedResponse & {
            items: Array<RentRecord>;
        });
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/rent/records',
            query: {
                'contract_id': contractId,
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * 确认付款
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public confirmPayment(
        requestBody: ConfirmPaymentRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: RentRecord;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/rent/confirm-payment',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 提醒付款
     * @param requestBody
     * @returns ApiResponse 成功
     * @throws ApiError
     */
    public remindPayment(
        requestBody: RemindPaymentRequest,
    ): CancelablePromise<ApiResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/rent/remind',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
