/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComplaintType } from './ComplaintType';
export type ComplaintRequest = {
    type: ComplaintType;
    content: string;
    /**
     * 被投诉的房东ID（type=landlord 时必填）
     */
    landlord_id?: number;
    /**
     * 被投诉的房源ID（type=house 时必填，房东由房源反推）
     */
    house_id?: number;
};

