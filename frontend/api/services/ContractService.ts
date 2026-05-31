/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { ConfirmContractRequest } from '../models/ConfirmContractRequest';
import type { Contract } from '../models/Contract';
import type { ContractStatus } from '../models/ContractStatus';
import type { CreateContractRequest } from '../models/CreateContractRequest';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ContractService {
    public readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * 发起租赁请求
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public createContract(
        requestBody: CreateContractRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: Contract;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/contract',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取合同列表
     * @param page
     * @param pageSize
     * @param status
     * @returns any 成功
     * @throws ApiError
     */
    public getContracts(
        page?: number,
        pageSize?: number,
        status?: ContractStatus,
    ): CancelablePromise<(ApiResponse & {
        data?: (PaginatedResponse & {
            items: Array<Contract>;
        });
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contract/list',
            query: {
                'page': page,
                'page_size': pageSize,
                'status': status,
            },
        });
    }
    /**
     * 获取合同详情
     * @param contractId
     * @returns any 成功
     * @throws ApiError
     */
    public getContractDetail(
        contractId: number,
    ): CancelablePromise<(ApiResponse & {
        data?: Contract;
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/contract/{contract_id}',
            path: {
                'contract_id': contractId,
            },
        });
    }
    /**
     * 确认合同
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public confirmContract(
        requestBody: ConfirmContractRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: Contract;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/contract/confirm',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 终止合同
     * @param contractId
     * @returns ApiResponse 成功
     * @throws ApiError
     */
    public terminateContract(
        contractId: number,
    ): CancelablePromise<ApiResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/contract/{contract_id}/terminate',
            path: {
                'contract_id': contractId,
            },
        });
    }
}
