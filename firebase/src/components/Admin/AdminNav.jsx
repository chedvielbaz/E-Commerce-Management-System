import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import "../../styles/AdminNav.css";

const AdminNav = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate("/");
    }
  };

  return (
    <nav className="admin-nav">
      <NavLink to="/admin/categories" className="nav-link">
        קטגוריות
      </NavLink>
      <NavLink to="/admin/products" className="nav-link">
        מוצרים
      </NavLink>
      <NavLink to="/admin/customers" className="nav-link">
        לקוחות
      </NavLink>
      <NavLink to="/admin/statistics" className="nav-link">
        סטטיסטיקה
      </NavLink>
      <span
        className="admin-nav__logout"
        role="button"
        tabIndex={0}
        onClick={handleLogout}
        onKeyDown={(e) => e.key === "Enter" && handleLogout()}
      >
        התנתקות
      </span>
    </nav>
  );
};

export default AdminNav;
