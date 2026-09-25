import { create } from "zustand";
import { api } from "@/api/api";

// Ids of the signed-in user's favourite ads, loaded once so every heart on a page can show its state.
export const useFavouriteStore = create((set, get) => ({
    ids: new Set(),
    loaded: false,

    load: async () => {
        if (get().loaded) return;
        set({ loaded: true });
        try {
            const { data } = await api.get("/favourites/ids");
            set({ ids: new Set(data.data) });
        } catch {
            set({ loaded: false });
        }
    },

    clear: () => set({ ids: new Set(), loaded: false }),

    // Optimistic: flips the heart at once and puts it back if the API refuses.
    toggle: async (adId) => {
        const wasSaved = get().ids.has(adId);
        const next = new Set(get().ids);
        wasSaved ? next.delete(adId) : next.add(adId);
        set({ ids: next });
        try {
            await (wasSaved ? api.delete(`/favourites/${adId}`) : api.post(`/favourites/${adId}`));
            return true;
        } catch {
            const back = new Set(get().ids);
            wasSaved ? back.add(adId) : back.delete(adId);
            set({ ids: back });
            return false;
        }
    },
}));
