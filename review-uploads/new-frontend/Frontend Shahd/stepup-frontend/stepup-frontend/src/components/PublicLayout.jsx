import { Outlet } from "react-router-dom";
import DemoBanner from "./DemoBanner";
import PublicNavbar from "./PublicNavbar";
import Footer from "./Footer";

// شكل الصفحات العامة: Landing, Login, Signup, Privacy, Terms
export default function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <DemoBanner />
      <PublicNavbar />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
