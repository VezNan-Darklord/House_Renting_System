import { useMutation, useQuery } from "@tanstack/react-query";
import { rent } from "../instance";
import type { RepairRequest, RepairStatus, UpdateRepairStatusRequest } from "..";

type RepairListParams = {
    page?: number;
    pageSize?: number;
    status?: RepairStatus;
};

export function useRepairListQuery(params?: RepairListParams, enabled = true) {
    return useQuery({
        queryKey: ["repairList", params],
        queryFn: () => rent.repair.getRepairList(params?.page, params?.pageSize, params?.status),
        enabled,
    });
}

export function useRepairDetailQuery(repairId?: number, enabled = true) {
    return useQuery({
        queryKey: ["repairDetail", repairId],
        queryFn: () => rent.repair.getRepairDetail(repairId as number),
        enabled: Boolean(repairId) && enabled,
    });
}

export function useCreateRepairMutation() {
    return useMutation({
        mutationKey: ["repairCreate"],
        mutationFn: (data: RepairRequest) => rent.repair.createRepair(data),
    });
}

export function useUpdateRepairStatusMutation() {
    return useMutation({
        mutationKey: ["repairUpdateStatus"],
        mutationFn: (data: { repairId: number; data: UpdateRepairStatusRequest }) =>
            rent.repair.updateRepairStatus(data.repairId, data.data),
    });
}
