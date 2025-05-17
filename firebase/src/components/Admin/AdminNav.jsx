import React from "react";
import { NavLink } from "react-router-dom";

const AdminNav = () => {
  return (
    <nav className="admin-nav">
      <NavLink to="/admin/categories">קטגוריות</NavLink>
      <NavLink to="/admin/products">מוצרים</NavLink>
      <NavLink to="/admin/customers">לקוחות</NavLink>
      <NavLink to="/admin/statistics">סטטיסטיקה</NavLink>
    </nav>
  );
};

export default AdminNav;