import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { NavLink } from "react-router-dom";
import "../../styles/Global.css";
import "../../styles/AdminNav.css";
import CustomerNav from "./CustomerNav"; 
import blue_shirt from "../../pictures/blue_shirt.png";
import whiteShoes from "../../pictures/white shoes.png";
import black_socks from "../../pictures/black_socks.png";
import black_bag from "../../pictures/black_bag.png";
import black_skirt from "../../pictures/black_skirt.png";
import black_dress from "../../pictures/black_dress.png";
import jins_shirt from "../../pictures/jins_shirt.png";
import brown_shoes from "../../pictures/brown_shoes.png";
const imageMap = {
  "blue_shirt": blue_shirt,
  "white shoes": whiteShoes,
  "black_socks": black_socks,
  "black_bag": black_bag,
  "black_skirt": black_skirt,
  "black_dress": black_dress,
  "brown_shoes": brown_shoes,
  "jins_shirt": jins_shirt,
};

const ProductsCatalog = ({ currentUser, setCurrentUser }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cart, setCart] = useState({});
  const [salesData, setSalesData] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollection = collection(db, "products");
      const productsSnapshot = await getDocs(productsCollection);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
      setFilteredProducts(productsData);
    };

    const fetchCategories = async () => {
      const categoriesCollection = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
    };

    const fetchSalesData = async () => {
      const cartsCollection = collection(db, "shoppingCarts");
      const cartsSnapshot = await getDocs(cartsCollection);
      const salesCount = {};

      cartsSnapshot.docs.forEach(cartDoc => {
        const items = cartDoc.data().items; 
        if (items && typeof items === 'object' && !Array.isArray(items)) {
          Object.entries(items).forEach(([productId, quantity]) => {
            if (salesCount[productId]) {
              salesCount[productId] += quantity;
            } else {
              salesCount[productId] = quantity;
            }
          });
        } else {
          console.warn(`Expected items to be an object but got: ${typeof items}`);
        }
      });

      setSalesData(salesCount);
    };

    fetchProducts();
    fetchCategories();
    fetchSalesData();
  }, []);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    filterProducts(e.target.value, searchTerm, minPrice, maxPrice);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterProducts(selectedCategory, e.target.value, minPrice, maxPrice);
  };

  const handleMinPriceChange = (e) => {
    setMinPrice(e.target.value);
    filterProducts(selectedCategory, searchTerm, e.target.value, maxPrice);
  };

  const handleMaxPriceChange = (e) => {
    setMaxPrice(e.target.value);
    filterProducts(selectedCategory, searchTerm, minPrice, e.target.value);
  };

  const filterProducts = (category, search, min, max) => {
    const filtered = products.filter(product => {
      const matchesCategory = category ? product.categoryId === category : true;
      const matchesSearch = product.productName.toLowerCase().includes(search.toLowerCase());
      const matchesPrice = (min === "" || product.price >= Number(min)) && (max === "" || product.price <= Number(max));
      return matchesCategory && matchesSearch && matchesPrice;
    });
    setFilteredProducts(filtered);
  };

  const updateCart = (productId, quantity) => {
    setCart(prevCart => {
      const updatedCart = { ...prevCart };
      if (quantity === 0) {
        delete updatedCart[productId];
      } else {
        updatedCart[productId] = quantity;
      }
      return updatedCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const updatedCart = { ...prevCart };
      delete updatedCart[productId];
      return updatedCart;
    });
  };

  const calculateTotalCost = () => {
    return Object.keys(cart).reduce((total, productId) => {
      const product = products.find(p => p.id === productId);
      return total + (product.price * cart[productId]);
    }, 0);
  };

  const handleOrder = async () => {
    if (!currentUser) {
      alert("עליך להתחבר כדי לבצע הזמנה.");
      return;
    }
  
    const userId = currentUser.id; 
    const purchaseDate = new Date().toISOString(); 
    const finalPrice = calculateTotalCost(); 
  
    const items = {};
    for (const [productId, quantity] of Object.entries(cart)) {
      items[productId] = quantity; 
    }
  
    try {
      await addDoc(collection(db, "shoppingCarts"), {
        userId,
        purchaseDate,
        items,
        finalPrice,
      });
      alert(`Total cost: ${finalPrice} ₪ - ההזמנה בוצעה בהצלחה!`);
      setCart({}); 
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("הייתה שגיאה בביצוע ההזמנה. אנא נסה שוב.");
    }
  };

  return (
    <div className="products-catalog">
     <CustomerNav setCurrentUser={setCurrentUser}  className="admin-nav"/> 

      <div className="header">
        <h2>שלום לקוח</h2>
        <h1>קטלוג מוצרים</h1>
      </div>

      <div className="filter-bar">
        <select onChange={handleCategoryChange}>
          <option value="">כל הקטגוריות</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.categoryName}</option>
          ))}
        </select>
        <input type="text" placeholder="חפש לפי שם מוצר" value={searchTerm} onChange={handleSearchChange} />
        <input type="number" placeholder="מחיר מינימלי" value={minPrice} onChange={handleMinPriceChange} />
        <input type="number" placeholder="מחיר מקסימלי" value={maxPrice} onChange={handleMaxPriceChange} />
      </div>

      <div className="catalog-container">
        <div className="products-list">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-item">
              <h2>{product.productName}</h2>
              <p>{product.description}</p>
              <img src={imageMap[product.imageLink]} alt={product.productName} style={{ maxWidth: "100%", height: "auto" }} />
              <p>מחיר: {product.price} ₪</p>
              <p>כמות זמינה: {product.quantity}</p>
              <p>מספר יחידות שנמכרו: {salesData[product.id] || 0}</p>
              <div className="quantity-selector">
                <button onClick={() => updateCart(product.id, Math.max((cart[product.id] || 0) - 1, 0))}>-</button>
                <span>{cart[product.id] || 0}</span>
                <button onClick={() => updateCart(product.id, (cart[product.id] || 0) + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart">
          <h2>עגלת הקניות</h2>
          {Object.keys(cart).map(productId => {
            const product = products.find(p => p.id === productId);
            return (
              <div key={productId} className="cart-item">
                <span>{product?.productName}: {cart[productId]} יחידות</span>
                <span>מחיר: {product?.price} ₪</span> {/* הוסף שדה זה */}
                <button onClick={() => removeFromCart(productId)}>x</button>
                <div className="quantity-selector">
                  <button onClick={() => updateCart(productId, Math.max((cart[productId] || 0) - 1, 0))}>-</button>
                  <span>{cart[productId]}</span>
                  <button onClick={() => updateCart(productId, (cart[productId] || 0) + 1)}>+</button>
                </div>
              </div>
            );
          })}

          <h3>סך הכל: {calculateTotalCost()} ₪</h3>
          <button onClick={handleOrder}>Order</button>
        </div>
      </div>
    </div>
  );
};

export default ProductsCatalog;
