import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";
import AppLayout from "./components/AppLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import { Privacy, Terms } from "./pages/Legal";
import NotFound from "./pages/NotFound";

import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import CVUpload from "./pages/CVUpload";
import CVReview from "./pages/CVReview";
import Skills from "./pages/Skills";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import SavedJobs from "./pages/SavedJobs";
import Settings from "./pages/Settings";

// الصفحات العامة (من غير تسجيل دخول) ثم الصفحات المحمية. أي صفحة جوّه ProtectedRoute
// بترجّع المستخدم للـ Login لو مش مسجّل.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<CVUpload />} />
              <Route path="/review" element={<CVReview />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/saved" element={<SavedJobs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
