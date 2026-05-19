/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DecorationType } from './DecorationType';
import type { HouseStatus } from './HouseStatus';
import type { HouseType } from './HouseType';
export type House = {
    id?: number;
    landlord_id?: number;
    landlord_nickname?: string;
    address_province?: string;
    address_city?: string;
    address_district?: string;
    address_detail?: string;
    house_type?: HouseType;
    layout?: string;
    area?: number;
    monthly_rent?: number;
    deposit?: number;
    decoration?: DecorationType;
    facilities?: Array<string>;
    description?: string;
    images?: Array<string>;
    status?: HouseStatus;
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;
};

