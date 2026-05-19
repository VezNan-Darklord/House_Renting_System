/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessage } from './ChatMessage';
export type ChatHistoryResponse = {
    room_id?: number;
    messages?: Array<ChatMessage>;
    total?: number;
    page?: number;
    page_size?: number;
};

