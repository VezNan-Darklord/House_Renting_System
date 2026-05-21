import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type { ApiResponse, ChatHistoryResponse, ChatRoom } from '..';
import { rent } from '../instance';

type ChatRoomsResponse = ApiResponse & {
    data?: Array<ChatRoom>;
};

type ChatHistoryResponseWrapper = ApiResponse & {
    data?: ChatHistoryResponse;
};

type ChatHistoryParams = {
    roomId: number;
    page?: number;
    pageSize?: number;
};

const chatKeys = {
    all: ['chat'] as const,
    rooms: () => [...chatKeys.all, 'rooms'] as const,
    history: (params: ChatHistoryParams) => [...chatKeys.all, 'history', params] as const,
};

export const useChatRooms = (options?: UseQueryOptions<ChatRoomsResponse, ApiError>) => {
    return useQuery({
        queryKey: chatKeys.rooms(),
        queryFn: () => rent.chat.getChatRooms(),
        ...options,
    });
};

export const useChatHistory = (
    params: ChatHistoryParams | undefined,
    options?: UseQueryOptions<ChatHistoryResponseWrapper, ApiError>
) => {
    return useQuery({
        queryKey: params ? chatKeys.history(params) : chatKeys.history({ roomId: 0 }),
        queryFn: () => rent.chat.getChatHistory(params?.roomId as number, params?.page, params?.pageSize),
        enabled: Boolean(params?.roomId) && (options?.enabled ?? true),
        ...options,
    });
};

export { chatKeys };
