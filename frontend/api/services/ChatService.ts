/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { ChatHistoryResponse } from '../models/ChatHistoryResponse';
import type { ChatRoom } from '../models/ChatRoom';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ChatService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * 获取聊天室列表
     * @returns any 成功
     * @throws ApiError
     */
    public getChatRooms(): CancelablePromise<(ApiResponse & {
        data?: Array<ChatRoom>;
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/chat/rooms',
        });
    }
    /**
     * 获取历史消息
     * @param roomId
     * @param page
     * @param pageSize
     * @returns any 成功
     * @throws ApiError
     */
    public getChatHistory(
        roomId: number,
        page?: number,
        pageSize?: number,
    ): CancelablePromise<(ApiResponse & {
        data?: ChatHistoryResponse;
    })> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/chat/rooms/{room_id}/messages',
            path: {
                'room_id': roomId,
            },
            query: {
                'page': page,
                'page_size': pageSize,
            },
        });
    }
}
