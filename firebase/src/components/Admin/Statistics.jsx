import React, { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { NavLink } from "react-router-dom";

// Register the necessary components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Statistics() {
  const [productsData, setProductsData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsAndCustomers = async () => {
      try {
        // Fetch products
        const productsCollection = collection(db, "products");
        const unsubscribeProducts = onSnapshot(productsCollection, (snapshot) => {
          const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            soldQuantity: 0,
            soldQuantityForCustomer: {}
          }));
          calculateSoldQuantities(products);
        });

        // Fetch customers
        const customersCollection = collection(db, "users");
        const unsubscribeCustomers = onSnapshot(customersCollection, (snapshot) => {
          const customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCustomersData(customers);
          setCustomerOptions(customers.map(customer => ({ id: customer.id, name: customer.fullName || customer.fullname })));
        });

        // Cleanup subscriptions on unmount
        return () => {
          unsubscribeProducts();
          unsubscribeCustomers();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCustomers();
  }, []);

  const calculateSoldQuantities = (products) => {
    const shoppingCartsCollection = collection(db, "shoppingCarts");
    onSnapshot(shoppingCartsCollection, (snapshot) => {
      const shoppingCarts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Reset sold quantities
      products.forEach(product => {
        product.soldQuantity = 0;
        product.soldQuantityForCustomer = {};
      });

      // Calculate sold quantities
      shoppingCarts.forEach(cart => {
        const { items, userId } = cart;
        if (items) {
          Object.entries(items).forEach(([productId, quantity]) => {
            const product = products.find(p => p.id === productId);
            if (product) {
              product.soldQuantity += quantity;

              if (!product.soldQuantityForCustomer[userId]) {
                product.soldQuantityForCustomer[userId] = 0;
              }
              product.soldQuantityForCustomer[userId] += quantity;
            }
          });
        }
      });

      setProductsData(products);
    });
  };

  const handleCustomerChange = (event) => {
    setSelectedCustomerId(event.target.value);
  };

  const generateColors = (count) => {
    const colors = [];
    const usedColors = new Set();

    while (colors.length < count) {
      const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`;
      if (!usedColors.has(color)) {
        colors.push(color);
        usedColors.add(color);
      }
    }

    return colors;
  };

  // Prepare pie chart data
  const pieData = {
    labels: productsData.map(product => product.productName),
    datasets: [
      {
        data: productsData.map(product => product.soldQuantity || 0), // ודא שמוצרים עם 0 מוצגים
        backgroundColor: generateColors(productsData.length), // צבעים ייחודיים לכל מוצר
      }
    ]
  };

  // Prepare bar chart data for selected customer
  const barData = {
    labels: productsData.map(product => product.productName),
    datasets: [
      {
        label: selectedCustomerId ? customersData.find(customer => customer.id === selectedCustomerId)?.fullName : "בחר לקוח",
        data: selectedCustomerId 
          ? productsData.map(product => 
              product.soldQuantityForCustomer && product.soldQuantityForCustomer[selectedCustomerId] !== undefined 
                ? product.soldQuantityForCustomer[selectedCustomerId] 
                : 0) 
          : [],
        backgroundColor: '#36A2EB',
      }
    ]
  };

  if (loading) {
    return <p>טוען נתונים...</p>;
  }

  if (productsData.length === 0) {
    return <p>אין נתונים להצגה בתרשים העוגה.</p>;
  }

  return (
    <div>
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
      <h1>Statistics Page</h1>
      <div>
        <h2>Products Sold (Pie Chart)</h2>
        <Pie data={pieData} />
      </div>
      <div>
        <h2>Quantity per Product Sold (Bar Chart)</h2>
        <select onChange={handleCustomerChange}>
          <option value="">בחר לקוח</option>
          {customerOptions.map(customer => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
        <Bar data={barData} />
      </div>
    </div>
  );
}

export default Statistics;