import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setCsrfToken } from "../api/client";
import { getCurrentSession, logout as apiLogout } from "../api/auth";
import { getProfile } from "../api/profile";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState("");

  const refreshUser = useCallback(async (sessionResult = null) => {
    const session = sessionResult || await getCurrentSession();
    if (session?.csrf_token) setCsrfToken(session.csrf_token);
    const profile = await getProfile();
    const nextUser = {
      id: session?.user?.id,
      email: session?.user?.email || profile.email,
      name: profile.name || session?.user?.email?.split("@")[0] || "User",
      onboarded: Boolean(profile.onboarded),
    };
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then(async (session) => {
        if (!active) return;
        if (session?.csrf_token) setCsrfToken(session.csrf_token);
        const profile = await getProfile();
        if (!active) return;
        setUser({
          id: session?.user?.id, email: session?.user?.email || profile.email,
          name: profile.name || session?.user?.email?.split("@")[0] || "User",
          onboarded: Boolean(profile.onboarded),
        });
      })
      .catch((error) => {
        if (!active) return;
        setUser(null);
        if (error.status && error.status !== 401) setNotice(error.message);
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onExpired = () => { setUser(null); setNotice("Your session has expired. Please sign in again."); setCsrfToken(""); };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const signIn = useCallback(async (result) => {
    if (result?.csrf_token) setCsrfToken(result.csrf_token);
    await refreshUser(result);
    setNotice("");
    setChecking(false);
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    try { await apiLogout(); } catch { /* Clear local auth state even if the server is unreachable. */ }
    setUser(null); setNotice(""); setCsrfToken(""); setChecking(false);
  }, []);

  const updateUser = useCallback((changes) => setUser((current) => current ? { ...current, ...changes } : current), []);
  const clearNotice = useCallback(() => setNotice(""), []);
  const value = useMemo(() => ({ user, checking, notice, signIn, signOut, updateUser, clearNotice }), [user, checking, notice, signIn, signOut, updateUser, clearNotice]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
