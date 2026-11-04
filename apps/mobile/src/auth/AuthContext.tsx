import type { AuthUser } from "@lislestart/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, type Credentials, type Registration } from "../api";

interface AuthState {
  /** undefined pendant la vérification de la session au démarrage. */
  user: AuthUser | null | undefined;
  login(credentials: Credentials): Promise<void>;
  register(registration: Registration): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Session partagée par toute l'app ; le cookie, lui, est gardé par la pile réseau d'Android. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    // Serveur injoignable au démarrage : on reste déconnecté, l'écran Compte permettra de réessayer
    api.me().then(setUser, () => setUser(null));
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    setUser(await api.login(credentials));
  }, []);

  const register = useCallback(async (registration: Registration) => {
    setUser(await api.register(registration));
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error("useAuth doit être utilisé sous AuthProvider");
  return state;
}
