import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/firebaseConfig";
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
  const [authResolved, setAuthResolved] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        setAuthResolved(true);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (!snap.exists) {
          await signOut(auth);
          setCurrentUser(null);
          setAuthResolved(true);
          return;
        }
        const profile = snap.data();
        setCurrentUser({
          id: fbUser.uid,
          ...profile,
          email: fbUser.email ?? profile.email ?? "",
        });
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthResolved(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authResolved || currentUser) return;
    const path = location.pathname;
    const allowed =
      path === "/" ||
      path.startsWith("/app/login") ||
      path.startsWith("/app/register");
    if (!allowed) {
      navigate("/");
    }
  }, [authResolved, currentUser, location.pathname, navigate]);

  return (
    <div className="app-layout">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app/login" element={<Login />} />
        <Route path="/app/register" element={<Register />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/statistics" element={<AdminStatistics />} />
        <Route
          path="/customer/my-account"
          element={<MyAccount currentUser={currentUser} setCurrentUser={setCurrentUser} />}
        />
        <Route path="/customer/my-orders" element={<MyOrders currentUser={currentUser} />} />
        <Route path="/customer/products" element={<Products currentUser={currentUser} />} />
      </Routes>
    </div>
  );
}

export default App;
