import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { ApiError } from '..';
import type {
    ApiResponse,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    User,
} from '..';
import { rent } from '../instance';

const userKeys = {
    all: ['user'] as const,
    profile: () => [...userKeys.all, 'profile'] as const,
};

type AuthResponse = ApiResponse & {
    data?: {
        token: string;
        user: User;
    };
};

type ProfileResponse = ApiResponse & {
    data?: User;
};

export const useRegister = (options?: UseMutationOptions<AuthResponse, ApiError, RegisterRequest>) => {
    return useMutation({
        mutationFn: (payload) => rent.user.register(payload),
        ...options,
    });
};

export const useLogin = (options?: UseMutationOptions<AuthResponse, ApiError, LoginRequest>) => {
    return useMutation({
        mutationFn: (payload) => rent.user.login(payload),
        ...options,
    });
};

export const useProfile = (options?: UseQueryOptions<ProfileResponse, ApiError>) => {
    return useQuery({
        queryKey: userKeys.profile(),
        queryFn: () => rent.user.getProfile(),
        ...options,
    });
};

export const useUpdateProfile = (
    options?: UseMutationOptions<ProfileResponse, ApiError, UpdateProfileRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.user.updateProfile(payload),
        ...options,
    });
};

export const useChangePassword = (
    options?: UseMutationOptions<ApiResponse, ApiError, ChangePasswordRequest>
) => {
    return useMutation({
        mutationFn: (payload) => rent.user.changePassword(payload),
        ...options,
    });
};

export { userKeys };
