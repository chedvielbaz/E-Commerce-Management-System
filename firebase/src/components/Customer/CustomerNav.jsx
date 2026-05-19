import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import "../../styles/AdminNav.css";

const CustomerNav = () => {
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
      <NavLink to="/customer/my-account" className="nav-link">
        החשבון שלי
      </NavLink>
      <NavLink to="/customer/my-orders" className="nav-link">
        ההזמנות שלי
      </NavLink>
      <NavLink to="/customer/products" className="nav-link">
        מוצרים
      </NavLink>
      <span
        className="admin-nav__logout"
        role="button"
        tabIndex={0}
        onClick={handleLogout}
        onKeyDown={(e) => e.key === "Enter" && handleLogout()}
      >
        יציאה
      </span>
    </nav>
  );
};

export default CustomerNav;
