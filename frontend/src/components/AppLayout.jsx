import { Outlet } from "react-router-dom";
import DemoBanner from "./DemoBanner";
import Navbar from "./Navbar";

// شكل الصفحات بعد تسجيل الدخول: بانر الـ Demo + نافبار + محتوى الصفحة
export default function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <DemoBanner />
      <Navbar />
      <main id="main" tabIndex={-1} className="container page">
        <Outlet />
      </main>
    </>
  );
}
