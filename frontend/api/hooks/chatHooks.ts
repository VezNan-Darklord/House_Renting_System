import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rent } from "../instance";
import type { CreateChatRoomRequest } from "../models/CreateChatRoomRequest";

type ChatHistoryParams = {
    roomId: number;
    page?: number;
    pageSize?: number;
};

export function useChatRoomsQuery(enabled = true) {
    return useQuery({
        queryKey: ["chatRooms"],
        queryFn: () => rent.chat.getChatRooms(),
        enabled,
    });
}

export function useChatHistoryQuery(params?: ChatHistoryParams, enabled = true) {
    return useQuery({
        queryKey: ["chatHistory", params],
        queryFn: () => rent.chat.getChatHistory(params?.roomId as number, params?.page, params?.pageSize),
        enabled: Boolean(params?.roomId) && enabled,
    });
}

// 创建新的聊天
export function useCreateChatRoomMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["createChatRoom"],
        mutationFn: (data: CreateChatRoomRequest) => rent.chat.createChatRoom(data),
        onSuccess: () => {
            // 创建成功后刷新聊天室列表
            queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
        },
    });
}
