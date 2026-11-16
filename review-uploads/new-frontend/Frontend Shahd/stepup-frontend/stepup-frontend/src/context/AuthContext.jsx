import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TOKEN_KEY } from "../api/client";
import { getProfile } from "../api/profile";
import { logout as apiLogout } from "../api/auth";
import { load, save, remove } from "../utils/storage";

// الـ Context ده بيحفظ: مين المستخدم المسجّل، وهل بنتأكد من الجلسة دلوقتي، ورسالة (زي "session expired").
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const toUser = (p) => ({ name: p.name, email: p.email, onboarded: p.onboarded });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(load(TOKEN_KEY))); // في توكن محفوظ؟ لازم نتأكد منه
  const [notice, setNotice] = useState("");

  // لما الصفحة تتفتح (أو تتعمل refresh): نرجّع الجلسة لو التوكن لسه شغال
  useEffect(() => {
    if (!load(TOKEN_KEY)) return;
    let cancelled = false;
    getProfile()
      .then((p) => !cancelled && setUser(toUser(p)))
      .catch((e) => {
        if (cancelled) return;
        if (e.kind === "auth") setNotice("Your session has expired. Please log in again.");
        else setNotice(e.message); // مثلًا السيرفر واقع
      })
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // client.js بيبعت الحدث ده لما أي طلب يرجع 401 في نص الاستخدام
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setNotice("Your session has expired. Please log in again.");
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const signIn = useCallback(({ token, user: u }) => {
    save(TOKEN_KEY, token);
    setUser(u);
    setNotice("");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // حتى لو فشل، نمسح الجلسة من المتصفح
    }
    remove(TOKEN_KEY);
    setUser(null);
    setNotice("");
  }, []);

  const updateUser = useCallback((changes) => setUser((u) => (u ? { ...u, ...changes } : u)), []);
  const clearNotice = useCallback(() => setNotice(""), []);

  const value = useMemo(
    () => ({ user, checking, notice, signIn, signOut, updateUser, clearNotice }),
    [user, checking, notice, signIn, signOut, updateUser, clearNotice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
