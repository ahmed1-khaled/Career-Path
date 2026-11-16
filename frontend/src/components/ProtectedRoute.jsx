import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "./Status";

// أي صفحة جوّه الـ route ده محتاجة تسجيل دخول. لو مفيش مستخدم بنرجّعه للـ Login
// ونفتكر الصفحة اللي كان رايحلها علشان نرجّعه ليها بعد الدخول.
export default function ProtectedRoute() {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Loading text="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
