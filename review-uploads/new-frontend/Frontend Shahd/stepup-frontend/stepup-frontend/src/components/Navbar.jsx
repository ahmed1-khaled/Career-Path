import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/jobs", label: "Jobs" },
  { to: "/saved", label: "Saved" },
  { to: "/review", label: "CV Review" },
  { to: "/settings", label: "Settings" },
];

// النافبار بتاع الصفحات اللي بعد تسجيل الدخول
export default function Navbar() {
  const [open, setOpen] = useState(false); // القايمة مفتوحة ولا لا (في الموبايل بس)
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // أي تنقّل بيقفل القايمة
  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/dashboard" className="logo">
          ✦ StepUp
        </Link>

        <button
          type="button"
          className="menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          <span className={open ? "burger open" : "burger"} />
        </button>

        <nav id="main-nav" className={open ? "open" : ""} aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}>
              {l.label}
            </NavLink>
          ))}
          <div className="nav-actions">
            <Link to="/upload" className="btn btn-light btn-sm">
              Upload CV
            </Link>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
