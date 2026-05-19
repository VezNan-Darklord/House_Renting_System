/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComplaintStatus } from './ComplaintStatus';
import type { ComplaintType } from './ComplaintType';
export type ComplaintRecord = {
    id?: number;
    tenant_id?: number;
    tenant_nickname?: string;
    type?: ComplaintType;
    type_label?: string;
    content?: string;
    status?: ComplaintStatus;
    status_label?: string;
    admin_feedback?: string;
    created_at?: string;
    updated_at?: string;
};

