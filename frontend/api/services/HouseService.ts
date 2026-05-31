/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { House } from '../models/House';
import type { HouseListItem } from '../models/HouseListItem';
import type { HouseRequest } from '../models/HouseRequest';
import type { HouseStatus } from '../models/HouseStatus';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { UpdateHouseStatusRequest } from '../models/UpdateHouseStatusRequest';
import type { UploadHouseImagesRequest } from '../models/UploadHouseImagesRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class HouseService {
    public readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * 发布房源
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public createHouse(
        requestBody: HouseRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: House;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/house',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取房源列表
     * @param page
     * @param pageSize
     * @param status
     * @returns any 成功
     * @throws ApiError
     */
    public getHouseList(
        page?: number,
        pageSize?: number,
        status?: HouseStatus,
    ): CancelablePromise<(ApiResponse & {
        data?: (PaginatedResponse & {
            items: Array<HouseListItem>;
        });
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/house/list',
            query: {
                'page': page,
                'page_size': pageSize,
                'status': status,
            },
        });
    }
    /**
     * 获取房源详情
     * @param houseId
     * @returns any 成功
     * @throws ApiError
     */
    public getHouseDetail(
        houseId: number,
    ): CancelablePromise<(ApiResponse & {
        data?: House;
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/house/{house_id}',
            path: {
                'house_id': houseId,
            },
        });
    }
    /**
     * 编辑房源
     * @param houseId
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public updateHouse(
        houseId: number,
        requestBody: HouseRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: House;
    })> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/house/{house_id}',
            path: {
                'house_id': houseId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 删除房源
     * @param houseId
     * @returns ApiResponse 成功
     * @throws ApiError
     */
    public deleteHouse(
        houseId: number,
    ): CancelablePromise<ApiResponse> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/house/{house_id}',
            path: {
                'house_id': houseId,
            },
        });
    }
    /**
     * 更新房源状态
     * @param houseId
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public updateHouseStatus(
        houseId: number,
        requestBody: UpdateHouseStatusRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: House;
    })> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/house/{house_id}/status',
            path: {
                'house_id': houseId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 上传房源图片
     * @param formData
     * @returns any 成功
     * @throws ApiError
     */
    public uploadImages(
        formData: UploadHouseImagesRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: {
            urls: Array<string>;
        };
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/house/upload-images',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
