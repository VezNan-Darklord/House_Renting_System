/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RentStatus } from './RentStatus';
export type RentRecord = {
    id?: number;
    contract_id?: number;
    month?: string;
    amount?: number;
    status?: RentStatus;
    status_label?: string;
    paid_at?: string;
};

