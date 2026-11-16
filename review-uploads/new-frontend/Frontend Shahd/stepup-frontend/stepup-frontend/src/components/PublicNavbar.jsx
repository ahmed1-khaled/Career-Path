import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sections = [
  { id: "how", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "faq", label: "FAQ" },
];

// النافبار بتاع الصفحات العامة (Landing / Login / Signup)
export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const onLanding = pathname === "/";

  useEffect(() => setOpen(false), [pathname]);

  // بنستخدم scrollIntoView بدل #anchor علشان ميتعارضش مع الـ Router
  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          ✦ StepUp
        </Link>

        <button
          type="button"
          className="menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="public-nav"
          onClick={() => setOpen(!open)}
        >
          <span className={open ? "burger open" : "burger"} />
        </button>

        <nav id="public-nav" className={open ? "open" : ""} aria-label="Main">
          {onLanding &&
            sections.map((s) => (
              <button key={s.id} type="button" className="nav-link" onClick={() => goTo(s.id)}>
                {s.label}
              </button>
            ))}
          <div className="nav-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-light btn-sm">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-light btn-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
