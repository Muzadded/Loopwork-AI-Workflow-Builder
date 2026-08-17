import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'signup';
  isLoading: boolean;
  error: string | null;

  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'loopwork_user_session';

const getSavedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthStore>((set, get) => {
  const initialUser = getSavedUser();

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    isAuthModalOpen: false,
    authMode: 'login',
    isLoading: false,
    error: null,

    openAuthModal: (mode = 'login') => set({ isAuthModalOpen: true, authMode: mode, error: null }),
    closeAuthModal: () => set({ isAuthModalOpen: false, error: null }),
    setAuthMode: (mode) => set({ authMode: mode, error: null }),

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        await new Promise((res) => setTimeout(res, 600)); // smooth simulation delay
        if (!email || !password) throw new Error('Please enter both email and password.');
        
        const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        
        const loggedUser: User = {
          id: `usr_${Date.now()}`,
          name: formattedName || 'Work User',
          email,
          role: 'Workspace Member',
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
        }

        set({ user: loggedUser, isAuthenticated: true, isAuthModalOpen: false });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Login failed' });
      } finally {
        set({ isLoading: false });
      }
    },

    signup: async (name, email, password) => {
      set({ isLoading: true, error: null });
      try {
        await new Promise((res) => setTimeout(res, 700));
        if (!name || !email || !password) throw new Error('All fields are required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const newUser: User = {
          id: `usr_${Date.now()}`,
          name,
          email,
          role: 'Workspace Creator',
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        }

        set({ user: newUser, isAuthenticated: true, isAuthModalOpen: false });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Signup failed' });
      } finally {
        set({ isLoading: false });
      }
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      set({ user: null, isAuthenticated: false });
    },
  };
});
