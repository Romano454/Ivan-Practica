import { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi, type SessionUser } from '../api/auth';

interface AuthContextValue {
  user: SessionUser | null;
  login: (data: { email: string; password: string; captchaToken: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem('mc_user');
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      localStorage.removeItem('mc_user');
      return null;
    }
  });

  const login: AuthContextValue['login'] = async (data) => {
    const res = await authApi.login(data);
    localStorage.setItem('mc_token', res.accessToken);
    localStorage.setItem('mc_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout(); // registra SALIDA en el log de accesos
    } catch {
      // la sesión local se cierra aunque el backend no responda
    }
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
