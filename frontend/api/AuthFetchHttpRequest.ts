import type { ApiRequestOptions } from './core/ApiRequestOptions';
import { ApiError } from './core/ApiError';
import { BaseHttpRequest } from './core/BaseHttpRequest';
import type { CancelablePromise } from './core/CancelablePromise';
import { CancelablePromise as CancelablePromiseImpl } from './core/CancelablePromise';
import type { OpenAPIConfig } from './core/OpenAPI';
import { request as __request } from './core/request';
import { message } from 'antd';

const TOKEN_STORAGE_KEY = 'access_token';
const AUTH_EXPIRED_EVENT = 'auth:expired';
const EXPIRY_NOTICE_COOLDOWN_MS = 5000;
let lastExpiredNoticeAt = 0;

const shouldSkipAuthHandling = (options: ApiRequestOptions): boolean => {
    const url = options.url;
    return url.startsWith('/auth/login') || url.startsWith('/auth/register');
};

const clearAccessToken = () => {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
};

const dispatchAuthExpired = () => {
    if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
};

const notifyAuthExpired = () => {
    const now = Date.now();
    if (now - lastExpiredNoticeAt < EXPIRY_NOTICE_COOLDOWN_MS) {
        return;
    }
    lastExpiredNoticeAt = now;
    message.error('登录状态已过期，请重新登录');
};

export class AuthFetchHttpRequest extends BaseHttpRequest {
    constructor(config: OpenAPIConfig) {
        super(config);
    }

    public override request<T>(options: ApiRequestOptions): CancelablePromise<T> {
        return new CancelablePromiseImpl(async (resolve, reject) => {
            try {
                const result = await __request<T>(this.config, options);
                resolve(result);
            } catch (error) {
                if (error instanceof ApiError && error.status === 401 && !shouldSkipAuthHandling(options)) {
                    clearAccessToken();
                    dispatchAuthExpired();
                    notifyAuthExpired();
                }
                reject(error);
            }
        });
    }
}
