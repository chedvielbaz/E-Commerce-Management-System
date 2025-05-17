import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/AdminNav.css";

const CustomerNav = ({ setCurrentUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser"); // הסרת המשתמש מ-localStorage
    navigate("/"); // החזרה לדף הראשי
  };

  return (
    <nav className="admin-nav">
      <NavLink to="/customer/my-account">החשבון שלי</NavLink>
      <NavLink to="/customer/my-orders">ההזמנות שלי</NavLink>
      <NavLink to="/customer/products">מוצרים</NavLink>
      <span onClick={handleLogout} style={{ cursor: "pointer" }}>יציאה</span>
    </nav>
  );
};

export default CustomerNav;
