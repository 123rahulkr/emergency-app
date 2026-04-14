import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,

      login: (userData) =>
        set({
          user: userData,
          isLoggedIn: true,
        }),

      logout: () =>
        set({
          user: null,
          isLoggedIn: false,
        }),

      updateLocation: (coords) =>
        set((state) => ({
          user: { ...state.user, currentLocation: coords },
        })),
    }),
    {
      name: "auth-storage",
    },
  ),
);

export default useAuthStore;
