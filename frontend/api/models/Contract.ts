/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContractStatus } from './ContractStatus';
export type Contract = {
    id?: number;
    house_id?: number;
    tenant_id?: number;
    landlord_id?: number;
    house_address?: string;
    house_layout?: string;
    house_area?: number;
    tenant_nickname?: string;
    tenant_phone?: string;
    landlord_nickname?: string;
    landlord_phone?: string;
    start_date?: string;
    end_date?: string;
    monthly_rent?: number;
    deposit?: number;
    terms?: string;
    status?: ContractStatus;
    status_label?: string;
    created_at?: string;
    updated_at?: string;
};

