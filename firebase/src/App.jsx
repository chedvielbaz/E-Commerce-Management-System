import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./components/Shared/Home";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import AdminCategories from "./components/Admin/Categories";
import AdminProducts from "./components/Admin/Products";
import AdminCustomers from "./components/Admin/Customers";
import AdminStatistics from "./components/Admin/Statistics";
import MyAccount from "./components/Customer/MyAccount";
import MyOrders from "./components/Customer/MyOrders";
import Products from "./components/Customer/Products";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(""); // ודא שה-state מוגדר
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      const storedUser = JSON.parse(localStorage.getItem("currentUser"));
      if (storedUser) {
        setCurrentUser(storedUser);
      } else {
        setError("לא מחובר.");
        if (!window.location.pathname.startsWith("/app/login") && !window.location.pathname.startsWith("/app/register")) {
          navigate("/");
        }
      }
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // שמירת המשתמש ב-localStorage בכל פעם שהוא משתנה
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app/login" element={<Login setCurrentUser={setCurrentUser} />} />
      <Route path="/app/register" element={<Register />} />
      <Route path="/admin/categories" element={<AdminCategories />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/customers" element={<AdminCustomers />} />
      <Route path="/admin/statistics" element={<AdminStatistics />} />
      <Route
        path="/customer/my-account"
        element={<MyAccount currentUser={currentUser} setCurrentUser={setCurrentUser} />}
      />
      <Route
        path="/customer/my-orders"
        element={<MyOrders currentUser={currentUser} setCurrentUser={setCurrentUser} />}
      />
      <Route
        path="/customer/products"
        element={<Products currentUser={currentUser} setCurrentUser={setCurrentUser} />}
      />
    </Routes>
  );
}

export default App;
