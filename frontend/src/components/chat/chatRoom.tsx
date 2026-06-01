import { Avatar, Button, Input } from "antd";
import { UserOutlined, VerticalRightOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { io, type Socket } from "socket.io-client";
import { useNavigate, useParams } from "react-router";
import Sidebar from "../index/sidebar";
import { useChatHistoryQuery, useChatRoomsQuery } from "../../../api/hooks/chatHooks";
import { useProfileQuery } from "../../../api/hooks/userHooks";
import { useUserContext } from "../userContext";
import { getAccessToken } from "../../../api/instance";
import type { ChatMessage, ChatRoom as ChatRoomType } from "../../../api";

const SOCKET_URL = "http://127.0.0.1:8000";

const formatTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const normalizeIncomingMessage = (payload: unknown): ChatMessage | null => {
    if (!payload || typeof payload !== "object") return null;
    if ("message" in payload) {
        const wrapped = (payload as { message?: ChatMessage }).message;
        if (wrapped && typeof wrapped === "object") return wrapped;
    }
    return payload as ChatMessage;
};

const getMessageTime = (value?: string) => {
    if (!value) return null;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : time;
};

const isSameContent = (a: ChatMessage, b: ChatMessage) =>
    Boolean(a.sender_id && b.sender_id && a.sender_id === b.sender_id && a.content === b.content);

const isSimilarTime = (a?: string, b?: string, toleranceMs = 8000) => {
    const timeA = getMessageTime(a);
    const timeB = getMessageTime(b);
    if (timeA === null || timeB === null) return false;
    return Math.abs(timeA - timeB) <= toleranceMs;
};

const isDuplicateMessage = (candidate: ChatMessage, existing: ChatMessage) => {
    if (candidate.id && existing.id && candidate.id === existing.id) return true;
    if (isSameContent(candidate, existing) && isSimilarTime(candidate.created_at, existing.created_at)) return true;
    return false;
};

export default function ChatRoom() {
    const { isLoggedIn, token } = useUserContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: roomsResponse, isLoading: roomsLoading } = useChatRoomsQuery(isLoggedIn);
    const rooms = useMemo(() => roomsResponse?.data as ChatRoomType[] ?? [], [roomsResponse]);
    const selectedRoomId = Number.isFinite(Number(id)) ? Number(id) : null;
    const [inputValue, setInputValue] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const activeRoomRef = useRef<number | null>(null);
    const messageListRef = useRef<HTMLDivElement | null>(null);

    const { data: profileResponse } = useProfileQuery(isLoggedIn);
    const profile = profileResponse?.data;
    const currentUserId = profile?.id;
    const currentNickname = profile?.nickname ?? "我";

    const selectedRoom = useMemo(
        () => rooms.find((room: ChatRoomType) => room.id === selectedRoomId) ?? null,
        [rooms, selectedRoomId]
    );

    const chatHistoryParams = selectedRoomId
        ? { roomId: selectedRoomId, page: 1, pageSize: 50 }
        : undefined;
    const { data: historyResponse, isLoading: historyLoading } = useChatHistoryQuery(
        chatHistoryParams,
        isLoggedIn
    );

    const [localMessagesByRoom, setLocalMessagesByRoom] = useState<Record<number, ChatMessage[]>>({});
    const messages = useMemo(() => {
        if (!selectedRoomId) return [];
        const historyMessages = historyResponse?.data?.messages ?? [];
        const localMessages = localMessagesByRoom[selectedRoomId] ?? [];
        if (localMessages.length === 0) return historyMessages;
        const merged = [...historyMessages];
        localMessages.forEach((local) => {
            if (!merged.some((existing) => isDuplicateMessage(local, existing))) {
                merged.push(local);
            }
        });
        return merged;
    }, [historyResponse?.data?.messages, localMessagesByRoom, selectedRoomId]);

    useEffect(() => {
        if (!token) return;
        const authToken = token ?? getAccessToken() ?? "";
        const socket = io(SOCKET_URL, {
            auth: { token: authToken },
            transports: ["websocket"],
        });
        socketRef.current = socket;
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleIncoming = (payload: unknown) => {
            const message = normalizeIncomingMessage(payload);
            if (!message) return;
            const targetRoomId = message.room_id ?? activeRoomRef.current;
            if (!targetRoomId) return;
            if (activeRoomRef.current && targetRoomId !== activeRoomRef.current) return;
            setLocalMessagesByRoom((prev) => ({
                ...prev,
                [targetRoomId]: (() => {
                    const current = prev[targetRoomId] ?? [];
                    if (current.some((existing) => isDuplicateMessage(message, existing))) {
                        return current;
                    }
                    const optimisticIndex = current.findIndex(
                        (existing) =>
                            !existing.id &&
                            isSameContent(existing, message) &&
                            isSimilarTime(existing.created_at, message.created_at)
                    );
                    if (optimisticIndex >= 0) {
                        const next = [...current];
                        next[optimisticIndex] = message;
                        return next;
                    }
                    return [...current, message];
                })(),
            }));
        };
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("receive_message", handleIncoming);
        socket.on("message", handleIncoming);
        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("receive_message", handleIncoming);
            socket.off("message", handleIncoming);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;
        if (!selectedRoomId) {
            activeRoomRef.current = null;
            return;
        }
        const previousRoomId = activeRoomRef.current;
        if (previousRoomId && previousRoomId !== selectedRoomId) {
            socket.emit("leave", { room_id: previousRoomId });
            socket.emit("leave_room", { room_id: previousRoomId });
        }
        socket.emit("join", { room_id: selectedRoomId });
        socket.emit("join_room", { room_id: selectedRoomId });
        activeRoomRef.current = selectedRoomId;
        return () => {
            socket.emit("leave", { room_id: selectedRoomId });
            socket.emit("leave_room", { room_id: selectedRoomId });
        };
    }, [selectedRoomId]);

    useEffect(() => {
        if (!messageListRef.current) return;
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }, [messages]);

    const handleSend = () => {
        if (!selectedRoomId || !inputValue.trim()) return;
        const socket = socketRef.current;
        if (!socket || !isConnected) return;
        const content = inputValue.trim();
        const outgoingMessage: ChatMessage = {
            room_id: selectedRoomId,
            sender_id: currentUserId,
            sender_nickname: currentNickname,
            content,
            created_at: new Date().toISOString(),
        };
        setLocalMessagesByRoom((prev) => ({
            ...prev,
            [selectedRoomId]: [...(prev[selectedRoomId] ?? []), outgoingMessage],
        }));
        socket.emit("send_message", {
            room_id: selectedRoomId,
            content,
        });
        setInputValue("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const renderRoomItem = (room: ChatRoomType) => {
        const isActive = room.id === selectedRoomId;
        return (
            <button
                key={room.id ?? room.house_id ?? room.created_at}
                type="button"
                onClick={() => {
                    if (!room.id) return;
                    navigate(`/chat/${room.id}`);
                }}
                className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    isActive ? "bg-orange-50" : "hover:bg-slate-50"
                }`}
            >
                <Avatar size={44} icon={<UserOutlined />} className="bg-slate-200 text-slate-600" />
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                            {room.other_user_nickname ?? "匿名用户"}
                        </div>
                        <div className="text-[11px] text-slate-400">{formatTime(room.last_message_time)}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {room.last_message ?? room.house_info ?? "暂无消息"}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-[#faf7f2] text-slate-900">
            <main className="mx-auto w-full max-w-400 px-4 pb-24 pt-25 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
                    <section className="rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                        <div className="mb-3 flex items-center justify-between px-2">
                            <div className="w-full">
                                <div className="text-xs font-medium uppercase tracking-[0.3em] text-orange-500">私聊</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">会话列表</div>
                                <Button className="float-right -translate-y-7" onClick={() => navigate("/")}>
                                    <VerticalRightOutlined />返回首页
                                </Button>
                            </div>
                        </div>
                        <div className="max-h-[70vh] space-y-2 overflow-y-auto px-1">
                            {!isLoggedIn ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                                    登录后查看聊天记录
                                </div>
                            ) : roomsLoading ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                                    会话加载中...
                                </div>
                            ) : rooms.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                                    暂无会话
                                </div>
                            ) : (
                                rooms.map(renderRoomItem)
                            )}
                        </div>
                    </section>

                    <section className="flex min-h-150 flex-col rounded-[28px] border border-white/70 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">
                                    {selectedRoom?.other_user_nickname ?? "选择一个会话"}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {selectedRoom?.house_info ?? "准备开始私聊"}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span
                                    className={`h-2 w-2 rounded-full ${
                                        isConnected ? "bg-emerald-400" : "bg-slate-300"
                                    }`}
                                />
                                {isConnected ? "在线" : "离线"}
                            </div>
                        </div>

                        {!isLoggedIn ? (
                            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                                请先登录，再开始聊天
                            </div>
                        ) : !selectedRoom ? (
                            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                                请选择一个会话
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5" ref={messageListRef}>
                                    {historyLoading && messages.length === 0 ? (
                                        <div className="text-center text-sm text-slate-400">聊天记录加载中...</div>
                                    ) : null}
                                    {messages.length === 0 && !historyLoading ? (
                                        <div className="text-center text-sm text-slate-400">暂无消息，开始聊天吧</div>
                                    ) : null}
                                    {messages.map((message, index) => {
                                        const isMine =
                                            (currentUserId && message.sender_id === currentUserId) ||
                                            message.sender_nickname === currentNickname;
                                        return (
                                            <div
                                                key={`${message.id ?? index}-${message.created_at ?? index}`}
                                                className={`flex items-start gap-3 ${
                                                    isMine ? "flex-row-reverse" : "flex-row"
                                                }`}
                                            >
                                                <Avatar
                                                    size={40}
                                                    icon={<UserOutlined />}
                                                    className="bg-slate-200 text-slate-600"
                                                />
                                                <div className={`max-w-[70%] ${isMine ? "text-right" : "text-left"}`}>
                                                    <div className="text-[11px] text-slate-500">
                                                        {message.sender_nickname ?? "匿名用户"}
                                                    </div>
                                                    <div
                                                        className={`mt-1 inline-block rounded-2xl px-4 py-2 text-sm ${
                                                            isMine
                                                                ? "bg-slate-900 text-white"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}
                                                    >
                                                        {message.content}
                                                    </div>
                                                    <div className="mt-1 text-[10px] text-slate-400">
                                                        {formatTime(message.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="border-t border-slate-100 px-6 py-4">
                                    <Input.TextArea
                                        value={inputValue}
                                        onChange={(event) => setInputValue(event.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="请输入要发送的消息，Enter 发送，Shift+Enter 换行"
                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                        className="rounded-2xl border-slate-200 bg-slate-50!"
                                    />
                                    <div className="mt-3 flex items-center justify-end text-xs text-slate-400">
                                        <Button
                                            type="primary"
                                            shape="round"
                                            className="bg-slate-900! shadow-none! text-white!"
                                            onClick={handleSend}
                                            disabled={!isConnected || !inputValue.trim()}
                                        >
                                            发送
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
            <Sidebar />
        </div>
    );
}
