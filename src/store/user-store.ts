// import { User } from "@/types/user";
// import { create } from "zustand";
//
// type UserStoreType = {
//   user: User | null;
// };
//
// const useUserStore = create<UserStoreType>((set) => ({
//   user: null,
// }));
//
// export { useUserStore };

import { create } from "zustand";
import { persist } from "zustand/middleware";


export interface UserDetails {
  name: string;
  mobile: string;
  amount: number;
  referralAmount: number;
  lastSeen: Date;
  email?: string;
  profileImage?: string;
}

type UserStoreType = {
  user: UserDetails | null;
  setUser: (user: UserDetails) => void;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
};

export const useUserStore = create<UserStoreType>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "user-storage",
      onRehydrateStorage: () => (state) => {
        // Use the `setHasHydrated` action we defined
        state?.setHasHydrated(true);
      },
    }
  )
);
