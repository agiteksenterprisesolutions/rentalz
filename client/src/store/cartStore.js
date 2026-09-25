import { create } from "zustand";
import { api } from "@/api/api";

const errorMessage = (e) => e.response?.data?.message || "Something went wrong. Please try again.";

// The signed-in user's cart, mirrored from the API. Every change goes to the API first and the cart it
// returns replaces this copy, so totals are always the server's (prices are never computed here).
export const useCartStore = create((set, get) => ({
    cart: null, // { items, total, currency, adCredits }
    loaded: false,
    busy: false,
    error: null,

    load: async () => {
        try {
            const { data } = await api.get("/cart");
            set({ cart: data.data, loaded: true, error: null });
        } catch (e) {
            set({ error: errorMessage(e), loaded: true });
        }
    },

    clearLocal: () => set({ cart: null, loaded: false, error: null }),

    quantityOf: (packageId) => get().cart?.items.find((i) => i.package.id === packageId)?.quantity ?? 0,

    // Sets a line's quantity (1 to 100); 0 removes it.
    setQuantity: async (packageId, quantity) => {
        set({ busy: true, error: null });
        try {
            const { data } =
                quantity <= 0
                    ? await api.delete(`/cart/items/${packageId}`)
                    : await api.post("/cart/items", { packageId, quantity });
            set({ cart: data.data, busy: false });
            return true;
        } catch (e) {
            set({ busy: false, error: errorMessage(e) });
            return false;
        }
    },

    empty: async () => {
        set({ busy: true, error: null });
        try {
            await api.delete("/cart");
            await get().load();
        } catch (e) {
            set({ error: errorMessage(e) });
        } finally {
            set({ busy: false });
        }
    },
}));
