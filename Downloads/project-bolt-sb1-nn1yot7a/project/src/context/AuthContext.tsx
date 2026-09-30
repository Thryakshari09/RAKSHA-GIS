import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { User } from '@/types';
import { dataService } from '@/services/dataService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const current = await dataService.getCurrentUser();
      setUser(current);
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const u = await dataService.login(email, password);
    setUser(u);
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ) => {
    const u = await dataService.register(fullName, email, password);
    setUser(u);
  };

  const logout = () => {
    dataService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await dataService.getCurrentUser();
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
