import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  BACKEND_SESSION_EVENT,
  getStoredBackendSession,
} from "@/lib/backendSession";
import type { BackendContractUser } from "@/lib/backendAuthContract";

type AuthUser = {
  id: string;
  email: string;
  role?: string;
  roles?: string[];
  full_name?: string | null;
  avatar_url?: string | null;
};

interface AuthContextType {
  user: AuthUser | null;
  session: {
    access_token: string;
    refresh_token: string | null;
    user: AuthUser;
  } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

const toAuthUser = (user: BackendContractUser | null): AuthUser | null => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    roles: user.roles,
    full_name: user.fullName ?? null,
    avatar_url: user.avatarUrl ?? null,
  };
};

const readAuthSession = (): AuthContextType["session"] => {
  const session = getStoredBackendSession();
  const user = toAuthUser(session.user);

  if (!user || !session.accessToken) {
    return null;
  }

  return {
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    user,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthContextType["session"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSessionState = () => {
      const nextSession = readAuthSession();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    syncSessionState();
    window.addEventListener(BACKEND_SESSION_EVENT, syncSessionState);
    window.addEventListener("storage", syncSessionState);

    return () => {
      window.removeEventListener(BACKEND_SESSION_EVENT, syncSessionState);
      window.removeEventListener("storage", syncSessionState);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
