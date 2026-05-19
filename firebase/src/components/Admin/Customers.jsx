import React, { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { parseCartLineKey } from "../../utils/cartLineKey";
import "../../styles/Global.css";
import "../../styles/AdminNav.css";
import AdminNav from "./AdminNav";

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

              for (const [rawKey, quantity] of Object.entries(items)) {
                const { productId } = parseCartLineKey(rawKey);
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
                userData.fullName || userData.fullname || "לא זמין",
              joinAt:
                userData.joinAt && userData.joinAt.seconds
                  ? new Date(userData.joinAt.seconds * 1000).toLocaleDateString()
                  : userData.joinat && userData.joinat.seconds
                  ? new Date(userData.joinat.seconds * 1000).toLocaleDateString()
                  : "לא זמין",
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
    <div className="page-shell customers-page">
      <AdminNav />
      <header className="page-head">
        <span className="page-head__eyebrow">ניהול חנות</span>
        <h1 className="page-head__title">לקוחות</h1>
        <p className="page-head__sub">רשימת משתמשים והיסטוריית רכישות מצטברות</p>
      </header>
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