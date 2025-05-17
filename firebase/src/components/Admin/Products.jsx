import React, { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import { NavLink } from "react-router-dom";
import "../../styles/Global.css"; // ייבוא קובץ CSS לעיצוב
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import blue_shirt from "../../pictures/blue_shirt.png";
import whiteShoes from "../../pictures/white shoes.png";
import black_socks from "../../pictures/black_socks.png"; 
import black_bag from "../../pictures/black_bag.png";
import black_skirt from "../../pictures/black_skirt.png";

const imageMap = {
  "blue_shirt": blue_shirt,
  "white shoes": whiteShoes,
  "black_socks": black_socks,
  "black_bag": black_bag,
  "black_skirt": black_skirt,
};

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buyers, setBuyers] = useState([]); // רשימת קונים
  const [showCategories, setShowCategories] = useState({}); // מצב להצגת קטגוריות נוספות

  // שליפת מוצרים, קטגוריות וקונים מ-Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // שליפת מוצרים
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // שליפת קטגוריות
        const categoriesCollection = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // שליפת קונים מתוך אוסף shoppingCarts
        const shoppingCartsCollection = collection(db, "shoppingCarts");
        const shoppingCartsSnapshot = await getDocs(shoppingCartsCollection);
        const shoppingCartsList = shoppingCartsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // שליפת נתוני משתמשים
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // יצירת מיפוי בין userId לשם מלא
        const usersMap = usersList.reduce((acc, user) => {
          acc[user.id] = user.fullName || user.username; // השתמש ב-username אם fullName לא קיים
          return acc;
        }, {});
        
        console.log("Users Map:", usersMap);
        
        // יצירת רשימת קונים עם פרטי המוצר
        const buyersList = shoppingCartsList.flatMap((cart) => {
          if (cart.items && typeof cart.items === 'object') {
            return Object.entries(cart.items).map(([productId, quantity]) => ({
              userId: cart.userId,
              fullName: usersMap[cart.userId] || "לא זמין",
              qty: quantity,
              date: cart.purchaseDate,
              productId: productId,
            }));
          }
          return [];
        });
        
        const formatDate = (timestamp) => {
          if (!timestamp) return "לא זמין"; // בדיקה אם התאריך קיים
          const date = new Date(timestamp); // יצירת אובייקט Date מהמחרוזת
          if (isNaN(date.getTime())) return "תאריך לא תקין"; // בדיקה אם התאריך תקין
          return date.toLocaleString(); // המרה למחרוזת קריאה
        };
  
        // הוספת הלוג כאן
        console.log("Buyers List:", buyersList);
  
        setProducts(productsList);
        setCategories(categoriesList);
        setBuyers(buyersList);
        console.log("Users Map:", usersMap);

        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return "לא זמין"; // בדיקה אם התאריך קיים
    const date = new Date(timestamp); // יצירת אובייקט Date מהמחרוזת
    if (isNaN(date.getTime())) return "תאריך לא תקין"; // בדיקה אם התאריך תקין
    return date.toLocaleString(); // המרה למחרוזת קריאה
  };

  // שמירת שינויים למוצר
  const handleSaveProduct = async (product) => {
    try {
      if (product.isNew) {
        // הוספת מוצר חדש ל-Firebase
        const productsCollection = collection(db, "products");
        const docRef = await addDoc(productsCollection, {
          productName: product.productName,
          categoryId: product.categoryId,
          description: product.description,
          imageLink: product.imageLink,
          price: product.price,
          quantity: product.quantity,
        });
  
        // עדכון ה-ID שנוצר ב-Firebase במצב המקומי
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, id: docRef.id, isNew: false } : p
          )
        );
      } else {
        // עדכון מוצר קיים ב-Firebase
        const productDoc = doc(db, "products", product.id);
        await updateDoc(productDoc, {
          productName: product.productName,
          categoryId: product.categoryId,
          description: product.description,
          imageLink: product.imageLink,
          price: product.price,
          quantity: product.quantity, // עדכון הכמות
        });
      }
  
      alert("השינויים נשמרו בהצלחה!");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("שגיאה בשמירת השינויים");
    }
  };

  // הוספת מוצר חדש
  const handleAddNewProduct = () => {
    // הוספת כרטיסיה חדשה למצב המקומי בלבד
    const newProduct = {
      id: Date.now().toString(), // מזהה זמני
      productName: "",
      categoryId: "",
      description: "",
      imageLink: "",
      price: "",
      quantity: "", // הוספת שדה כמות
      isNew: true, // מציין שזה מוצר חדש
    };
  
    setProducts((prev) => [...prev, newProduct]);
  };

  // הצגת קטגוריות נוספות
  const toggleCategories = (productId) => {
    setShowCategories((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className="products-container">
      {/* הניווט של המנהל */}
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
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <div className="product-field">
            <h4>Title:</h4>
            <input
              type="text"
              value={product.productName}
              onChange={(e) =>
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === product.id
                      ? { ...p, productName: e.target.value }
                      : p
                  )
                )
              }
            />
          </div>

          <div className="product-field">
            <h4>Category:</h4>
            <input
              type="checkbox"
              checked
              onChange={() => toggleCategories(product.id)}
            />
            <label>{categories.find((cat) => cat.id === product.categoryId)?.categoryName || "לא זמין"}</label>
            {showCategories[product.id] && (
              <div className="categories-dropdown">
                {categories.map((category) => (
                  <div key={category.id}>
                    <input
                      type="Radio" 
                      id={`${product.id}-${category.id}`}
                      name={`category-${product.id}`}
                      value={category.id}
                      checked={product.categoryId === category.id}
                      onChange={(e) =>
                        setProducts((prev) =>
                          prev.map((p) =>
                            p.id === product.id
                              ? { ...p, categoryId: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                    <label htmlFor={`${product.id}-${category.id}`}>
                      {category.categoryName}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="product-field">
            <h4>Description:</h4>
            <input
              type="text"
              value={product.description}
              onChange={(e) =>
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === product.id
                      ? { ...p, description: e.target.value }
                      : p
                  )
                )
              }
            />
          </div>

          <div className="product-field">
            <h4>Price:</h4>
            <input
              type="number"
              value={product.price}
              onChange={(e) =>
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === product.id ? { ...p, price: e.target.value } : p
                  )
                )
              }
            />
          </div>

          <div className="product-field">
            <h4>Quantity:</h4>
            <input
              type="number"
              value={product.quantity}
              onChange={(e) =>
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === product.id ? { ...p, quantity: e.target.value } : p
                  )
                )
              }
            />
          </div>

          <div className="product-field">
            <h4>Link to Pic:</h4>
            <input
              type="text"
              value={product.imageLink}
              onChange={(e) =>
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === product.id ? { ...p, imageLink: e.target.value } : p
                  )
                )
              }
            />
          <a href={imageMap[product.imageLink]} target="_blank" rel="noopener noreferrer">
  Open Image
</a>

          </div>

          <div className="product-field">
            <h4>Bought By:</h4>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {buyers
                  .filter((buyer) => buyer.productId === product.id)
                  .map((buyer) => (
                    <tr key={buyer.userId}>
                      <td>{buyer.fullName}</td>
                      <td>{buyer.qty}</td>
                      <td>{formatDate(buyer.date)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() =>
              product.isNew
                ? handleSaveProduct(product)
                : handleSaveProduct(product)
            }
          >
            Save
          </button>
        </div>
      ))}

      <div className="add-new-container">
        <button className="add-new-button" onClick={handleAddNewProduct}>
          Add New
        </button>
      </div>
    </div>
  );
}

export default Products;