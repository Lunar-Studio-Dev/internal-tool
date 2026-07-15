import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UserData = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type SessionData = {
  token: string;
  [key: string]: any;
};

interface UserState {
  // UI Auth Form States
  email: string;
  password: string; // keep it simple, actually let's allow it to be string
  isLoading: boolean;
  error: string;
  success: string;
  
  // Authenticated Data
  user: UserData | null;
  session: SessionData | null;
  
  // Basic Actions
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  
  // Session Actions
  setAuthPayload: (user: any, session: any) => void;
  clearAuth: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      email: "",
      password: "",
      isLoading: false,
      error: "",
      success: "",
      
      user: null,
      session: null,
      
      setEmail: (email) => set({ email }),
      setPassword: (password) => set({ password }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSuccess: (success) => set({ success }),
      
      setAuthPayload: (user, session) => set({ user, session }),
      clearAuth: () => set({ user: null, session: null })
    }),
    {
      name: 'auth-storage', // key in local storage
      storage: createJSONStorage(() => localStorage),
      // Crucial: Only persist user session data, never the form state (like password)!
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session 
      }),
    }
  )
);
