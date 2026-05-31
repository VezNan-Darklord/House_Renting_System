/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { DecorationType } from '../models/DecorationType';
import type { HouseType } from '../models/HouseType';
import type { SearchResult } from '../models/SearchResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SearchService {
    public readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * 搜索房源
     * @param page
     * @param pageSize
     * @param keyword
     * @param layout
     * @param province
     * @param city
     * @param district
     * @param minRent
     * @param maxRent
     * @param minArea
     * @param maxArea
     * @param houseType
     * @param decoration
     * @returns any 成功
     * @throws ApiError
     */
    public searchHouses(
        page?: number,
        pageSize?: number,
        keyword?: string,
        layout?: string,
        province?: string,
        city?: string,
        district?: string,
        minRent?: number,
        maxRent?: number,
        minArea?: number,
        maxArea?: number,
        houseType?: HouseType,
        decoration?: DecorationType,
    ): CancelablePromise<(ApiResponse & {
        data?: SearchResult;
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/search/houses',
            query: {
                'page': page,
                'page_size': pageSize,
                'keyword': keyword,
                'layout': layout,
                'province': province,
                'city': city,
                'district': district,
                'min_rent': minRent,
                'max_rent': maxRent,
                'min_area': minArea,
                'max_area': maxArea,
                'house_type': houseType,
                'decoration': decoration,
            },
        });
    }
}
