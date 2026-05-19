import React, { useState, useEffect, useRef } from "react";
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
import { parseCartLineKey } from "../../utils/cartLineKey";
import "../../styles/AdminNav.css";
import AdminNav from "./AdminNav";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function mergeSoldQuantities(productsRaw, shoppingCarts) {
  const rows = productsRaw.map((p) => ({
    ...p,
    soldQuantity: 0,
    soldQuantityForCustomer: {},
  }));
  const byId = new Map(rows.map((p) => [p.id, { ...p }]));

  for (const cart of shoppingCarts) {
    const { items, userId } = cart;
    if (!items || !userId) continue;
    for (const [rawKey, quantity] of Object.entries(items)) {
      const { productId } = parseCartLineKey(rawKey);
      const product = byId.get(productId);
      if (!product) continue;
      const qty = Number(quantity) || 0;
      product.soldQuantity += qty;
      if (!product.soldQuantityForCustomer[userId]) {
        product.soldQuantityForCustomer[userId] = 0;
      }
      product.soldQuantityForCustomer[userId] += qty;
    }
  }

  return Array.from(byId.values());
}

function Statistics() {
  const [productsData, setProductsData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const productsRef = useRef([]);
  const cartsRef = useRef([]);

  useEffect(() => {
    const mergeAndSet = () => {
      const merged = mergeSoldQuantities(productsRef.current, cartsRef.current);
      setProductsData(merged);
      setLoading(false);
    };

    const productsCollection = collection(db, "products");
    const unsubscribeProducts = onSnapshot(productsCollection, (snapshot) => {
      productsRef.current = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      mergeAndSet();
    });

    const shoppingCartsCollection = collection(db, "shoppingCarts");
    const unsubscribeCarts = onSnapshot(shoppingCartsCollection, (snapshot) => {
      cartsRef.current = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      mergeAndSet();
    });

    const customersCollection = collection(db, "users");
    const unsubscribeCustomers = onSnapshot(customersCollection, (snapshot) => {
      const customers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomersData(customers);
      const shoppers = customers.filter((u) => u.role !== "admin");
      const list = shoppers.length > 0 ? shoppers : customers;
      setCustomerOptions(
        list.map((customer) => ({
          id: customer.id,
          name:
            customer.fullName ||
            customer.fullname ||
            customer.email ||
            customer.username ||
            "ללא שם",
        }))
      );
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCarts();
      unsubscribeCustomers();
    };
  }, []);

  const handleCustomerChange = (event) => {
    setSelectedCustomerId(event.target.value);
  };

  const generateColors = (count) => {
    const base = [
      "rgba(20, 20, 20, 0.88)",
      "rgba(55, 55, 55, 0.8)",
      "rgba(90, 90, 90, 0.72)",
      "rgba(130, 130, 130, 0.62)",
      "rgba(170, 170, 170, 0.5)",
      "rgba(210, 210, 210, 0.45)",
    ];
    return Array.from({ length: count }, (_, i) => base[i % base.length]);
  };

  const pieData = {
    labels: productsData.map(product => product.productName),
    datasets: [
      {
        data: productsData.map((product) => Number(product.soldQuantity) || 0),
        backgroundColor: generateColors(productsData.length),
      }
    ]
  };

  const selectedCustomer = selectedCustomerId
    ? customersData.find((c) => c.id === selectedCustomerId)
    : null;
  const selectedCustomerLabel = selectedCustomer
    ? selectedCustomer.fullName ||
      selectedCustomer.fullname ||
      selectedCustomer.email ||
      selectedCustomer.username ||
      "לקוח"
    : "בחר לקוח";

  const barData = {
    labels: productsData.map((product) => product.productName),
    datasets: [
      {
        label: selectedCustomerLabel,
        data: productsData.map((product) => {
          if (!selectedCustomerId) return 0;
          const q =
            product.soldQuantityForCustomer &&
            product.soldQuantityForCustomer[selectedCustomerId];
          return q !== undefined && q !== null ? Number(q) || 0 : 0;
        }),
        backgroundColor: "rgba(20, 20, 20, 0.78)",
        borderRadius: 0,
      },
    ],
  };

  const tickColor = "#525252";
  const gridColor = "rgba(0, 0, 0, 0.06)";

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: tickColor,
          padding: 14,
          font: { family: "Heebo", size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#141414",
        bodyColor: "#525252",
        borderColor: "#e5e5e5",
        borderWidth: 1,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          font: { family: "Heebo", size: 13 },
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#141414",
        bodyColor: "#525252",
        borderColor: "#e5e5e5",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: tickColor, maxRotation: 45, minRotation: 0 },
        grid: { color: gridColor },
      },
      y: {
        beginAtZero: true,
        ticks: { color: tickColor },
        grid: { color: gridColor },
      },
    },
  };

  if (loading) {
    return (
      <div className="page-loading page-shell">
        <p>טוען נתונים…</p>
      </div>
    );
  }

  if (productsData.length === 0) {
    return (
      <div className="empty-state page-shell">
        <p>אין נתונים להצגה בתרשימים.</p>
      </div>
    );
  }

  return (
    <div className="page-shell stats-page">
      <AdminNav />
      <header className="page-head page-head--center">
        <span className="page-head__eyebrow">ניהול חנות</span>
        <h1 className="page-head__title">סטטיסטיקות מכירות</h1>
        <p className="page-head__sub">פיזור מכירות ופירוט כמויות לפי לקוח</p>
      </header>
      <div className="stats-grid">
        <div className="stats-card">
          <h2>פיזור מכירות לפי מוצר</h2>
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div className="stats-card">
          <h2>כמויות לפי לקוח נבחר</h2>
          <select
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            aria-label="בחירת לקוח לתרשים"
          >
            <option value="">בחר לקוח</option>
            {customerOptions.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {selectedCustomerId ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <p className="stats-bar-placeholder" role="status">
              בחרו לקוח מהרשימה כדי לראות פירוט כמויות לפי מוצר.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Statistics;
