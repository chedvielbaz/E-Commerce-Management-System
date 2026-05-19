import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { parseCartLineKey, variantDisplayHe } from "../../utils/cartLineKey";
import "../../styles/Orders.css";
import "../../styles/AdminNav.css";
import CustomerNav from "./CustomerNav";

const MyOrders = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) {
        return;
      }

      try {
        const ordersCollection = collection(db, "shoppingCarts");
        const ordersQuery = query(ordersCollection, where("userId", "==", currentUser.id));
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
      } catch (err) {
        setError("שגיאה בטעינת ההזמנות: " + err.message);
      }
    };

    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(productsCollection);
        const productsData = {};
        productsSnapshot.docs.forEach(doc => {
          productsData[doc.id] = doc.data();
        });
        setProducts(productsData);
      } catch (err) {
        setError("שגיאה בטעינת המוצרים: " + err.message);
      }
    };

    fetchOrders();
    fetchProducts();
  }, [currentUser]);

  return (
    <div className="page-shell orders-page">
      <div className="customer-nav-wrap">
        <CustomerNav />
      </div>
      <header className="page-head">
        <span className="page-head__eyebrow">אזור לקוח</span>
        <h1 className="page-head__title">ההזמנות שלי</h1>
        <p className="page-head__sub">פירוט פריטים לפי הזמנה</p>
      </header>
      {error && <p className="form-error">{error}</p>}
      <div className="orders-table-wrap">
      {orders.length === 0 && !error ? (
        <p>אין הזמנות זמינות.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>שם המוצר</th>
              <th>מידה</th>
              <th>גוון</th>
              <th>כמות</th>
              <th>מחיר</th>
              <th>תאריך</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) =>
              Object.entries(order.items || {}).map(([rawKey, quantity]) => {
                const { productId, size, variantKey } = parseCartLineKey(rawKey);
                const name = products[productId]?.productName || "לא נמצא";
                const unit = products[productId]?.price ?? 0;
                return (
                  <tr key={`${order.id}-${rawKey}`}>
                    <td>{name}</td>
                    <td>{size || "—"}</td>
                    <td>{variantDisplayHe(variantKey)}</td>
                    <td>{quantity}</td>
                    <td>{(Number(unit) * Number(quantity)).toFixed(2)} ₪</td>
                    <td>{new Date(order.purchaseDate).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default MyOrders;