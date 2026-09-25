import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/api/authApi";
import { api } from "@/api/api";
import { useFavouriteStore } from "@/store/favouriteStore";
import { useCartStore } from "@/store/cartStore";

const initial = { user: null, role: null, permissions: [], isAuthenticated: false, isLoading: false, error: null };

const errorMessage = (e) => e.response?.data?.message || e.message || "Something went wrong";
const errorCode = (e) => e.response?.data?.code ?? null; // e.g. EMAIL_NOT_VERIFIED

export const useAuthStore = create(
    persist(
        (set, get) => ({
            ...initial,

            // called by the axios interceptor when a refresh fails
            forceLogout: () => set({ ...initial }),

            can: (permission) => get().permissions.includes(permission),

            register: async (form) => {
                set({ isLoading: true, error: null });
                try {
                    const { data } = await authApi.post("/register", form);
                    set({ isLoading: false });
                    return { ok: true, message: data.message, emailSent: data.data?.verificationEmailSent !== false };
                } catch (e) {
                    set({ isLoading: false, error: errorMessage(e) });
                    return { ok: false, message: errorMessage(e) };
                }
            },

            login: async (form) => {
                set({ isLoading: true, error: null });
                try {
                    const { data } = await authApi.post("/login", form);
                    const { user, permissions } = data.data;
                    set({ user, role: user.role, permissions, isAuthenticated: true, isLoading: false });
                    return { ok: true };
                } catch (e) {
                    set({ isLoading: false, error: errorMessage(e) });
                    return { ok: false, message: errorMessage(e), code: errorCode(e) };
                }
            },

            logout: async () => {
                try { await authApi.post("/logout"); } finally { set({ ...initial }); useFavouriteStore.getState().clear(); useCartStore.getState().clearLocal(); }
            },

            // rehydrate the session from the API (call on app load)
            fetchMe: async () => {
                try {
                    const { data } = await api.get("/auth/me");
                    const { user, permissions } = data.data;
                    set({ user, role: user.role, permissions, isAuthenticated: true });
                } catch {
                    set({ ...initial });
                }
            },
        }),
        {
            name: "rentalz-auth",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ user: s.user, role: s.role, permissions: s.permissions, isAuthenticated: s.isAuthenticated }),
        }
    )
);
