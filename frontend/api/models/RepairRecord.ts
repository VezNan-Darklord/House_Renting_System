/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RepairStatus } from './RepairStatus';
import type { UrgencyLevel } from './UrgencyLevel';
export type RepairRecord = {
    id?: number;
    house_id?: number;
    house_address?: string;
    tenant_id?: number;
    tenant_nickname?: string;
    description?: string;
    urgency?: UrgencyLevel;
    urgency_label?: string;
    status?: RepairStatus;
    status_label?: string;
    created_at?: string;
    updated_at?: string;
};

