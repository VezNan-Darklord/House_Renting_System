import { useMutation, useQuery } from "@tanstack/react-query";
import { rent } from "../instance";
import type {
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
} from "..";


export function useRegisterMutation() {
    return useMutation({
        mutationKey: ["userRegister"],
        mutationFn: (data: RegisterRequest) => rent.user.register(data),
    });
}

export function useLoginMutation() {
    return useMutation({
        mutationKey: ["userLogin"],
        mutationFn: (data: LoginRequest) => rent.user.login(data),
    });
}

export function useProfileQuery(enabled = true) {
    return useQuery({
        queryKey: ["userProfile"],
        queryFn: () => rent.user.getProfile(),
        enabled,
    });
}

export function useUpdateProfileMutation() {
    return useMutation({
        mutationKey: ["userUpdateProfile"],
        mutationFn: (data: UpdateProfileRequest) => rent.user.updateProfile(data),
    });
}

export function useChangePasswordMutation() {
    return useMutation({
        mutationKey: ["userChangePassword"],
        mutationFn: (data: ChangePasswordRequest) => rent.user.changePassword(data),
    });
}
