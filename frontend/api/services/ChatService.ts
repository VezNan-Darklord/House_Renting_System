/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponse } from '../models/ApiResponse';
import type { ChatHistoryResponse } from '../models/ChatHistoryResponse';
import type { ChatRoom } from '../models/ChatRoom';
import type { CreateChatRoomRequest } from '../models/CreateChatRoomRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ChatService {
    public readonly httpRequest: BaseHttpRequest;
    constructor(httpRequest: BaseHttpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * 创建聊天室
     * @param requestBody
     * @returns any 成功
     * @throws ApiError
     */
    public createChatRoom(
        requestBody: CreateChatRoomRequest,
    ): CancelablePromise<(ApiResponse & {
        data?: ChatRoom;
    })> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/chat/rooms',
            body: requestBody,
        });
    }
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
