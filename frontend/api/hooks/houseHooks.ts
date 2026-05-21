import { useMutation, useQuery } from "@tanstack/react-query";
import { rent } from "../instance";
import type { HouseRequest, HouseStatus, UpdateHouseStatusRequest, UploadHouseImagesRequest } from "..";

type HouseListParams = {
    page?: number;
    pageSize?: number;
    status?: HouseStatus;
};

export function useHouseListQuery(params?: HouseListParams, enabled = true) {
    return useQuery({
        queryKey: ["houseList", params],
        queryFn: () => rent.house.getHouseList(params?.page, params?.pageSize, params?.status),
        enabled,
    });
}

export function useHouseDetailQuery(houseId?: number, enabled = true) {
    return useQuery({
        queryKey: ["houseDetail", houseId],
        queryFn: () => rent.house.getHouseDetail(houseId as number),
        enabled: Boolean(houseId) && enabled,
    });
}

export function useCreateHouseMutation() {
    return useMutation({
        mutationKey: ["houseCreate"],
        mutationFn: (data: HouseRequest) => rent.house.createHouse(data),
    });
}

export function useUpdateHouseMutation() {
    return useMutation({
        mutationKey: ["houseUpdate"],
        mutationFn: (data: { houseId: number; data: HouseRequest }) =>
            rent.house.updateHouse(data.houseId, data.data),
    });
}

export function useDeleteHouseMutation() {
    return useMutation({
        mutationKey: ["houseDelete"],
        mutationFn: (houseId: number) => rent.house.deleteHouse(houseId),
    });
}

export function useUpdateHouseStatusMutation() {
    return useMutation({
        mutationKey: ["houseUpdateStatus"],
        mutationFn: (data: { houseId: number; data: UpdateHouseStatusRequest }) =>
            rent.house.updateHouseStatus(data.houseId, data.data),
    });
}

export function useUploadHouseImagesMutation() {
    return useMutation({
        mutationKey: ["houseUploadImages"],
        mutationFn: (data: UploadHouseImagesRequest) => rent.house.uploadImages(data),
    });
}
