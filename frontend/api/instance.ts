import { rentHouse } from "./rentHouse";
import { AuthFetchHttpRequest } from "./AuthFetchHttpRequest";

const TOKEN_STORAGE_KEY = "access_token";

export const getAccessToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
export const setAccessToken = (token: string) => localStorage.setItem(TOKEN_STORAGE_KEY, token);
export const clearAccessToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

const rent = new rentHouse(
    {
        BASE: "http://127.0.0.1:8000/api/v1",
        WITH_CREDENTIALS: false,
        CREDENTIALS: "include",
        TOKEN: async () => getAccessToken() ?? "",
    },
    AuthFetchHttpRequest
);

export { rent, TOKEN_STORAGE_KEY };
