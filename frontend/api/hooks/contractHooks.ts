import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type {
    ApiResponse,
    ConfirmContractRequest,
    Contract,
    ContractStatus,
    CreateContractRequest,
    PaginatedResponse,
} from '..';
import { rent } from '../instance';

type ContractListParams = {
    page?: number;
    pageSize?: number;
    status?: ContractStatus;
};

type ContractListResponse = ApiResponse & {
    data?: PaginatedResponse & {
        items: Array<Contract>;
    };
};

type ContractDetailResponse = ApiResponse & {
    data?: Contract;
};

const contractKeys = {
    all: ['contract'] as const,
    list: (params?: ContractListParams) => [...contractKeys.all, 'list', params ?? {}] as const,
    detail: (contractId?: number) => [...contractKeys.all, 'detail', contractId ?? null] as const,
};

export const useContractList = (
    params?: ContractListParams,
    options?: UseQueryOptions<ContractListResponse, ApiError>
) => {
    return useQuery({
        queryKey: contractKeys.list(params),
        queryFn: () => rent.contract.getContracts(params?.page, params?.pageSize, params?.status),
        ...options,
    });
};

export const useContractDetail = (
    contractId?: number,
    options?: UseQueryOptions<ContractDetailResponse, ApiError>
) => {
    return useQuery({
        queryKey: contractKeys.detail(contractId),
        queryFn: () => rent.contract.getContractDetail(contractId as number),
        enabled: Boolean(contractId) && (options?.enabled ?? true),
        ...options,
    });
};

export const useCreateContract = (
    options?: UseMutationOptions<ContractDetailResponse, ApiError, CreateContractRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.contract.createContract(payload),
        ...options,
    });
};

export const useConfirmContract = (
    options?: UseMutationOptions<ContractDetailResponse, ApiError, ConfirmContractRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.contract.confirmContract(payload),
        ...options,
    });
};

export const useTerminateContract = (
    options?: UseMutationOptions<ApiResponse, ApiError, number>
) => {
    return useMutation({
        mutationFn: (contractId) => rent.contract.terminateContract(contractId),
        ...options,
    });
};

export { contractKeys };
