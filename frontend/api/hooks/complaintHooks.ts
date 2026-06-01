import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rent } from "../instance";
import type { ComplaintRequest, ComplaintStatus, HandleComplaintRequest } from "..";

type ComplaintListParams = {
    page?: number;
    pageSize?: number;
    status?: ComplaintStatus;
};

export function useComplaintListQuery(params?: ComplaintListParams, enabled = true) {
    return useQuery({
        queryKey: ["complaintList", params],
        queryFn: () => rent.complaint.getComplaintList(params?.page, params?.pageSize, params?.status),
        enabled,
    });
}

export function useCreateComplaintMutation() {
    return useMutation({
        mutationKey: ["complaintCreate"],
        mutationFn: (data: ComplaintRequest) => rent.complaint.createComplaint(data),
    });
}

export function useHandleComplaintMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["complaintHandle"],
        mutationFn: (data: HandleComplaintRequest) => rent.complaint.handleComplaint(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaintList"] }),
    });
}
