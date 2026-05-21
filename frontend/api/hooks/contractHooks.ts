import { useMutation, useQuery } from "@tanstack/react-query";
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
    return useMutation({
        mutationKey: ["contractConfirm"],
        mutationFn: (data: ConfirmContractRequest) => rent.contract.confirmContract(data),
    });
}

export function useTerminateContractMutation() {
    return useMutation({
        mutationKey: ["contractTerminate"],
        mutationFn: (contractId: number) => rent.contract.terminateContract(contractId),
    });
}
