import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthContextType["session"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSessionState = (s: AuthContextType["session"]) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      syncSessionState(s as AuthContextType["session"]);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      syncSessionState(s as AuthContextType["session"]);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
