import { useQuery } from "@tanstack/react-query";
import { rent } from "../instance";

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
