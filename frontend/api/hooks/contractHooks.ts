import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rent } from "../instance";
import type { ConfirmContractRequest, ContractStatus, CreateContractRequest } from "..";

type ContractListParams = {
    page?: number;
    pageSize?: number;
    status?: ContractStatus;
};

export function useContractListQuery(params?: ContractListParams, enabled = true) {
    return useQuery({
        queryKey: ["contractList", params],
        queryFn: () => rent.contract.getContracts(params?.page, params?.pageSize, params?.status),
        enabled,
    });
}

export function useContractDetailQuery(contractId?: number, enabled = true) {
    return useQuery({
        queryKey: ["contractDetail", contractId],
        queryFn: () => rent.contract.getContractDetail(contractId as number),
        enabled: Boolean(contractId) && enabled,
    });
}

export function useCreateContractMutation() {
    return useMutation({
        mutationKey: ["contractCreate"],
        mutationFn: (data: CreateContractRequest) => rent.contract.createContract(data),
    });
}

export function useConfirmContractMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["contractConfirm"],
        mutationFn: (data: ConfirmContractRequest) => rent.contract.confirmContract(data),
        onSuccess: ()=>queryClient.invalidateQueries({ queryKey: ["contractList"] }),
    });
}

export function useTerminateContractMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["contractTerminate"],
        mutationFn: (contractId: number) => rent.contract.terminateContract(contractId),
        onSuccess: ()=> queryClient.invalidateQueries({ queryKey: ["contractList"] }),
    });
}
