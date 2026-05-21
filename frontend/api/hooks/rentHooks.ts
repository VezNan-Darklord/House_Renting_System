import { useMutation, useQuery } from "@tanstack/react-query";
import { rent } from "../instance";
import type { ConfirmPaymentRequest, RemindPaymentRequest } from "..";

type RentRecordsParams = {
    contractId?: number;
    page?: number;
    pageSize?: number;
};

export function useRentRecordsQuery(params?: RentRecordsParams, enabled = true) {
    return useQuery({
        queryKey: ["rentRecords", params],
        queryFn: () => rent.rent.getRentRecords(params?.contractId, params?.page, params?.pageSize),
        enabled,
    });
}

export function useConfirmPaymentMutation() {
    return useMutation({
        mutationKey: ["rentConfirmPayment"],
        mutationFn: (data: ConfirmPaymentRequest) => rent.rent.confirmPayment(data),
    });
}

export function useRemindPaymentMutation() {
    return useMutation({
        mutationKey: ["rentRemindPayment"],
        mutationFn: (data: RemindPaymentRequest) => rent.rent.remindPayment(data),
    });
}
