import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../../styles/AdminNav.css"; // ייבוא קובץ CSS לעיצוב

function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = await Promise.all(
          usersSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            const cartQuery = query(
              collection(db, "shoppingCarts"),
              where("userId", "==", userDoc.id)
            );
            const cartSnapshot = await getDocs(cartQuery);
            const purchaseMap = new Map();

            for (const cartDoc of cartSnapshot.docs) {
              const cartData = cartDoc.data();
              const items = cartData.items || {};

              for (const [productId, quantity] of Object.entries(items)) {
                const existingPurchase = purchaseMap.get(productId);
                const totalQuantity = existingPurchase
                  ? existingPurchase.quantity + quantity
                  : quantity;

                purchaseMap.set(productId, {
                  productId: productId,
                  quantity: totalQuantity,
                  purchaseDate: cartData.purchaseDate
                    ? new Date(cartData.purchaseDate).toLocaleDateString()
                    : "לא זמין",
                });
              }
            }

            const purchaseList = Array.from(purchaseMap.values());
            const productsCollection = collection(db, "products");
            const productsSnapshot = await getDocs(productsCollection);
            const productMap = {};

            productsSnapshot.docs.forEach((productDoc) => {
              const productData = productDoc.data();
              productMap[productDoc.id] = productData.productName;
            });

            const updatedPurchaseList = purchaseList.map((purchase) => ({
              ...purchase,
              productName: productMap[purchase.productId] || "לא זמין",
            }));

            return {
              id: userDoc.id,
              fullName:
                userData.fullName || userData.fullname || "לא זמין", // בדיקה לשני השמות
              joinAt:
                userData.joinAt && userData.joinAt.seconds
                  ? new Date(userData.joinAt.seconds * 1000).toLocaleDateString()
                  : userData.joinat && userData.joinat.seconds
                  ? new Date(userData.joinat.seconds * 1000).toLocaleDateString()
                  : "לא זמין", // בדיקה לשני השמות
              role: userData.role || "לא זמין",
              purchases: updatedPurchaseList,
            };
          })
        );
        setCustomers(usersList);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="customers-container">
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
      </nav>
      <h2>שלום מנהל</h2>
      <h1>Customers</h1>
      <table>
        <thead>
          <tr>
            <th>שם מלא</th>
            <th>הצטרף ב</th>
            <th>תפקיד</th>
            <th>מוצרים שנקנו</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.fullName}</td>
                <td>{customer.joinAt}</td>
                <td>{customer.role}</td>
                <td>
                  <table>
                    <thead>
                      <tr>
                        <th>מוצר</th>
                        <th>כמות</th>
                        <th>תאריך רכישה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.purchases.length > 0 ? (
                        customer.purchases.map((purchase, index) => (
                          <tr key={index}>
                            <td>{purchase.productName}</td>
                            <td>
                              {isNaN(purchase.quantity)
                                ? "לא זמין"
                                : purchase.quantity.toString()}
                            </td>
                            <td>{purchase.purchaseDate}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3">אין רכישות זמינות</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">אין לקוחות זמינים</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;