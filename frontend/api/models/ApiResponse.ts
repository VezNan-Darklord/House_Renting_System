/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ApiResponse = {
    /**
     * 业务状态码：200成功，4xx客户端错误，5xx服务端错误
     */
    code: number;
    /**
     * 提示信息
     */
    message: string;
    /**
     * 业务数据
     */
    data?: Record<string, any> | null;
};

