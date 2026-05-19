/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { ChangePasswordRequest } from '../models/ChangePasswordRequest';
import type { LoginRequest } from '../models/LoginRequest';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { UpdateProfileRequest } from '../models/UpdateProfileRequest';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UserService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * 用户注册
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public register(
        requestBody: RegisterRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: {
            token: string;
            user: User;
        };
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 用户登录
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public login(
        requestBody: LoginRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: {
            token: string;
            user: User;
        };
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取个人信息
     * @returns any 成功
     * @throws ApiError
     */
    public getProfile(): CancelablePromise<(ApiResponse & {
        data?: User;
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/user/profile',
        });
    }
    /**
     * 更新个人信息
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public updateProfile(
        requestBody: UpdateProfileRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: User;
    })> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/user/profile',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 修改密码
     * @param requestBody
     * @returns ApiResponse 成功
     * @throws ApiError
     */
    public changePassword(
        requestBody: ChangePasswordRequest,
    ): CancelablePromise<ApiResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/user/change-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
