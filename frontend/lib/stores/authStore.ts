/**
 * Authentication store using Zustand.
 * 
 * Manages user authentication state and provides actions for:
 * - User registration
 * - User login/logout
 * - Profile fetching and updating
 * - Token management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTranslator } from 'next-intl';
import messages from './auth.messages.json';
import * as http from '@/lib/services/http';
import type {
  User,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  LoginResponse,
  RegisterResponse,
  ProfileResponse,
  ProfileUpdateResponse,
} from '@/types/user';

const t = createTranslator({ locale: 'en', timeZone: 'America/Bogota', messages, namespace: 'Auth' });
let initialization: Promise<void> | null = null;

function authenticationError(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { details?: Record<string, unknown>; error?: string } } })?.response?.data;
  const details = Object.values(response?.details ?? {}).flat().filter(
    (message): message is string => typeof message === 'string',
  );
  return details.join(' ') || response?.error || fallback;
}

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Getters
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  login: (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchProfile: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isLoading: false,
      isUpdating: false,
      error: null,
      
      // Computed
      isAuthenticated: false,
      isInitialized: false,
      
      // Actions
      register: async (payload) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await http.post<RegisterResponse>('/auth/register/', payload);
          const { user, tokens } = response.data;
          
          http.setTokens(tokens.access, tokens.refresh);
          set({ user, isLoading: false, isAuthenticated: true });
          
          return { success: true };
        } catch (error: unknown) {
          const errorMessage = authenticationError(error, t('registrationFailed'));
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      login: async (payload) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await http.post<LoginResponse>('/auth/login/', payload);
          const { user, tokens } = response.data;
          
          http.setTokens(tokens.access, tokens.refresh);
          set({ user, isLoading: false, isAuthenticated: true });
          
          return { success: true };
        } catch (error: unknown) {
          const errorMessage = authenticationError(error, t('loginFailed'));
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },
      
      logout: () => {
        http.clearTokens();
        set({ user: null, error: null, isAuthenticated: false, isLoading: false });
      },
      
      fetchProfile: async () => {
        if (!http.isAuthenticated()) {
          return { success: false, error: 'Not authenticated' };
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await http.get<ProfileResponse>('/auth/profile/');
          const { user } = response.data;
          
          set({ user, isLoading: false, isAuthenticated: true });
          return { success: true };
        } catch (error: unknown) {
          const errorMessage = authenticationError(error, 'Failed to fetch profile');
          set({ error: errorMessage, isLoading: false, user: null, isAuthenticated: false });
          return { success: false, error: errorMessage };
        }
      },
      
      updateProfile: async (payload) => {
        set({ isUpdating: true, error: null });
        
        try {
          // Handle file upload with FormData
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, value);
            }
          });
          
          const response = await http.patch<ProfileUpdateResponse>(
            '/auth/profile/update/',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          
          const { user } = response.data;
          set({ user, isUpdating: false });
          
          return { success: true };
        } catch (error: unknown) {
          const errorMessage = authenticationError(error, 'Failed to update profile');
          set({ error: errorMessage, isUpdating: false });
          return { success: false, error: errorMessage };
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      initializeAuth: () => {
        if (get().isInitialized) return Promise.resolve();
        if (!initialization) {
          initialization = (async () => {
            await useAuthStore.persist.rehydrate();
            if (!http.isAuthenticated()) {
              set({ user: null, isAuthenticated: false });
            } else if (!get().user) {
              await get().fetchProfile();
            } else {
              set({ isAuthenticated: true });
            }
          })().finally(() => {
            set({ isInitialized: true });
            initialization = null;
          });
        }
        return initialization;
      },
    }),
    {
      name: 'auth-storage',
      skipHydration: true,
      partialize: (state) => ({ user: state.user }), // Only persist user
    }
  )
);
