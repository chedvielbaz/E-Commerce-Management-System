import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../../styles/Orders.css";
import "../../styles/AdminNav.css";
import CustomerNav from "./CustomerNav";

const MyOrders = ({ currentUser, setCurrentUser }) => {
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
    <div className="orders">
      {/* הניווט של הלקוח */}
      <CustomerNav setCurrentUser={setCurrentUser} className="admin-nav" />

      {/* ברכת שלום ללקוח */}
      <h2>שלום לקוח</h2>
      <h1>ההזמנות שלי</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {orders.length === 0 && !error ? (
        <p>אין הזמנות זמינות.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>שם המוצר</th>
              <th>כמות</th>
              <th>מחיר מוצר</th>
              <th>תאריך</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order =>
              Object.entries(order.items).map(([productId, quantity]) => (
                <tr key={`${order.id}-${productId}`}>
                  <td>{products[productId]?.productName || "לא נמצא"}</td>
                  <td>{quantity}</td>
                  <td>{(products[productId]?.price * quantity).toFixed(2)} ₪</td>
                  <td>{new Date(order.purchaseDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyOrders;