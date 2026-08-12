import { create } from "zustand";

import type { Session, User } from "@supabase/supabase-js";

interface AuthStore{
    user: User | null;
    setUser: (user: User | null) => void;
    session: Session | null;
    setSession: (session: Session | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    isPasswordRecovery: boolean;
    setIsPasswordRecovery: (loading: boolean) => void;
    role: string | null;
    setRole: (role: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    session: null,
    setSession: (session) => set({ session }),
    loading: true, 
    setLoading: (loading) => set({ loading }),
    isPasswordRecovery: true, 
    setIsPasswordRecovery: (isPasswordRecovery) => set({ isPasswordRecovery }),
    role: null,
    setRole: (role) => set({role}) 
}))