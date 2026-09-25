import axios from "axios";
import { authApi } from "@/api/authApi";
import { useAuthStore } from "@/store/authStore";

// Browser -> Node API (cookies attached automatically)
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
    failedQueue = [];
};

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/auth/refresh-token", "/auth/logout", "/auth/verify-email", "/auth/confirm-email-change"];
const shouldSkipRefresh = (url = "") => AUTH_PATHS.some((path) => url.includes(path));

// On 401: refresh once (queueing concurrent requests), then retry
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original?._retry && !shouldSkipRefresh(original?.url)) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => failedQueue.push({ resolve, reject })).then(() => api(original));
            }

            original._retry = true;
            isRefreshing = true;

            try {
                await authApi.post("/refresh-token");
                processQueue();
                return api(original);
            } catch (err) {
                processQueue(err);
                useAuthStore.getState().forceLogout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
