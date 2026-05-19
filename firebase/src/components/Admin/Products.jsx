import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { db } from "../../firebase/firebaseConfig";
import "../../styles/Global.css";
import "../../styles/AdminNav.css";
import AdminNav from "./AdminNav";
import { useToast } from "../../context/useToast";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { parseCartLineKey, variantDisplayHe } from "../../utils/cartLineKey";
import { STANDARD_SIZES } from "../../constants/sizes";
import { normalizeSizeStock, sumSizeStock } from "../../utils/productStock";
import { resolveProductImageSrc } from "../../utils/productImageSrc";
import { uploadImageToImgbb } from "../../utils/uploadImageImgbb";
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

function normalizeViteImgbbKey(raw) {
  if (typeof raw !== "string") return "";
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const IMGBB_API_KEY = normalizeViteImgbbKey(
  typeof import.meta.env.VITE_IMGBB_API_KEY === "string"
    ? import.meta.env.VITE_IMGBB_API_KEY
    : ""
);

function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [showCategories, setShowCategories] = useState({});
  const [uploadingImageFor, setUploadingImageFor] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);

  const closeDeleteConfirm = useCallback(() => {
    setConfirmDeleteProduct(null);
  }, []);

  useEffect(() => {
    if (!confirmDeleteProduct) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDeleteConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDeleteProduct, closeDeleteConfirm]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          let sizeStock = normalizeSizeStock(d.sizeStock);
          if (sumSizeStock(sizeStock) === 0 && Number(d.quantity) > 0) {
            sizeStock = { ...sizeStock, M: Number(d.quantity) };
          }
          return {
            id: docSnap.id,
            ...d,
            sizeStock,
          };
        });

        const categoriesCollection = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const shoppingCartsCollection = collection(db, "shoppingCarts");
        const shoppingCartsSnapshot = await getDocs(shoppingCartsCollection);
        const shoppingCartsList = shoppingCartsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const usersMap = usersList.reduce((acc, user) => {
          acc[user.id] = user.fullName || user.email || user.username;
          return acc;
        }, {});

        const buyersList = shoppingCartsList.flatMap((cart) => {
          if (cart.items && typeof cart.items === "object") {
            return Object.entries(cart.items).map(([rawKey, quantity]) => {
              const { productId, size, variantKey } = parseCartLineKey(rawKey);
              return {
                userId: cart.userId,
                fullName: usersMap[cart.userId] || "לא זמין",
                qty: quantity,
                date: cart.purchaseDate,
                productId,
                lineKey: rawKey,
                displaySize: size || "—",
                displayVariant: variantDisplayHe(variantKey),
              };
            });
          }
          return [];
        });

        setProducts(productsList);
        setCategories(categoriesList);
        setBuyers(buyersList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return "לא זמין";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "תאריך לא תקין";
    return date.toLocaleString();
  };

  const handleImageFileSelected = async (product, file) => {
    if (!file) return;
    if (!IMGBB_API_KEY) {
      toast.info(".env.local: VITE_IMGBB_API_KEY, ואז הפעלה מחדש של npm run dev");
      return;
    }
    setUploadingImageFor(product.id);
    try {
      const url = await uploadImageToImgbb(file, IMGBB_API_KEY);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, imageLink: url } : p))
      );
      toast.success("התמונה הועלתה. לחיצה על שמירה למוצר.");
    } catch (error) {
      console.error("ImgBB upload:", error);
      const m = error?.message || "";
      if (m === "INVALID_TYPE") toast.error("בחרו קובץ תמונה בלבד.");
      else if (m === "TOO_LARGE") toast.error("הקובץ גדול מדי (עד כ־30MB).");
      else if (m === "NO_IMG_API_KEY") toast.error("חסר מפתח ImgBB בהגדרות.");
      else if (m === "NETWORK_BLOCKED") {
        toast.error(
          "לא נפתח חיבור לשרת ההעלאה (חסימת רשת/נטפרי). נסו דפדפן או חיבור אחר שלא סונן."
        );
      } else toast.error(`העלאה נכשלה: ${m}`);
    } finally {
      setUploadingImageFor(null);
    }
  };

  const handleSaveProduct = async (product) => {
    try {
      if (product.isNew) {
        const productsCollection = collection(db, "products");
        const docRef = await addDoc(productsCollection, {
          productName: product.productName,
          categoryId: product.categoryId,
          description: product.description,
          imageLink: product.imageLink,
          price: product.price,
          sizeStock: product.sizeStock || normalizeSizeStock(),
          quantity: sumSizeStock(product.sizeStock || {}),
        });
  
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, id: docRef.id, isNew: false } : p
          )
        );
      } else {
        const productDoc = doc(db, "products", product.id);
        await updateDoc(productDoc, {
          productName: product.productName,
          categoryId: product.categoryId,
          description: product.description,
          imageLink: product.imageLink,
          price: product.price,
          sizeStock: product.sizeStock || normalizeSizeStock(),
          quantity: sumSizeStock(product.sizeStock || {}),
        });
      }
  
      toast.success("השינויים נשמרו בהצלחה.");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("שגיאה בשמירת השינויים.");
    }
  };

  const clearProductUiState = (productId) => {
    setShowCategories((prev) => {
      if (!prev[productId]) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const performDeleteProduct = async (product) => {
    if (!product) return;
    if (product.isNew) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      clearProductUiState(product.id);
      return;
    }
    try {
      await deleteDoc(doc(db, "products", product.id));
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      clearProductUiState(product.id);
      toast.success("המוצר נמחק.");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("שגיאה במחיקת המוצר.");
    }
  };

  const handleConfirmDeleteFinal = async () => {
    const product = confirmDeleteProduct;
    if (!product) return;
    closeDeleteConfirm();
    await performDeleteProduct(product);
  };

  const handleDeleteProductClick = (product) => {
    setConfirmDeleteProduct(product);
  };

  const handleAddNewProduct = () => {
    const emptyStock = Object.fromEntries(STANDARD_SIZES.map((s) => [s, 0]));
    const newProduct = {
      id: Date.now().toString(),
      productName: "",
      categoryId: "",
      description: "",
      imageLink: "",
      price: "",
      sizeStock: emptyStock,
      quantity: 0,
      isNew: true,
    };
  
    setProducts((prev) => [...prev, newProduct]);
  };

  const toggleCategories = (productId) => {
    setShowCategories((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className="page-shell products-admin">
      <AdminNav />
      <header className="page-head">
        <span className="page-head__eyebrow">ניהול חנות</span>
        <h1 className="page-head__title">מוצרים</h1>
        <p className="page-head__sub">עריכת פרטים, קטגוריה, מלאי ומעקב קונים</p>
      </header>
      <div className="products-container">
      <datalist id="admin-local-image-keys">
        {Object.keys(imageMap).map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <div className="product-field">
            <h4>שם מוצר</h4>
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
            <h4>קטגוריה</h4>
            <input
              type="checkbox"
              checked
              title="פתיחת רשימת קטגוריות"
              onChange={() => toggleCategories(product.id)}
            />
            <label>{categories.find((cat) => cat.id === product.categoryId)?.categoryName || "לא זמין"}</label>
            {showCategories[product.id] && (
              <div className="categories-dropdown">
                {categories.map((category) => (
                  <div key={category.id}>
                    <input
                      type="radio" 
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
            <h4>תיאור</h4>
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
            <h4>מחיר (₪)</h4>
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

          <div className="product-field product-field--stacked">
            <h4 className="product-field__label">מלאי לפי מידה</h4>
            <div className="admin-size-stock">
              {STANDARD_SIZES.map((sizeLabel) => (
                <label key={`${product.id}-${sizeLabel}`} className="admin-size-stock__cell">
                  <span className="admin-size-stock__lbl">{sizeLabel}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className="admin-size-stock__qty"
                    value={product.sizeStock?.[sizeLabel] ?? 0}
                    title={`יחידות במידה ${sizeLabel}`}
                    onChange={(e) => {
                      const v = Math.max(0, Math.floor(Number(e.target.value)) || 0);
                      setProducts((prev) =>
                        prev.map((p) =>
                          p.id === product.id
                            ? {
                                ...p,
                                sizeStock: {
                                  ...normalizeSizeStock(p.sizeStock),
                                  [sizeLabel]: v,
                                },
                              }
                            : p
                        )
                      );
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="admin-size-stock__total">
              סה״כ במלאי: <strong>{sumSizeStock(product.sizeStock)}</strong> יח׳
            </p>
          </div>

          <div className="product-field product-field--stacked">
            <h4 className="product-field__label">תמונת המוצר</h4>
            <div className="admin-product-image">
              <div className="admin-product-image__preview">
                <img
                  src={resolveProductImageSrc(product.imageLink, imageMap)}
                  alt=""
                />
              </div>
              <div className="admin-product-image__controls">
                <label
                  className="admin-product-image__pick"
                  title={IMGBB_API_KEY ? undefined : "להפעלה: VITE_IMGBB_API_KEY בקובץ .env.local בשורש firebase/"}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="admin-product-image__file"
                    disabled={uploadingImageFor === product.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) handleImageFileSelected(product, f);
                    }}
                  />
                  <span>
                    {uploadingImageFor === product.id
                      ? "מעלה…"
                      : "בחירת תמונה"}
                  </span>
                </label>
                <input
                  type="text"
                  className="admin-product-image__text"
                  list="admin-local-image-keys"
                  placeholder="קישור או מזהה קורס (למשל blue_shirt)"
                  autoComplete="off"
                  value={product.imageLink ?? ""}
                  onChange={(e) =>
                    setProducts((prev) =>
                      prev.map((p) =>
                        p.id === product.id ? { ...p, imageLink: e.target.value } : p
                      )
                    )
                  }
                />
                <a
                  className="admin-product-image__open"
                  href={resolveProductImageSrc(product.imageLink, imageMap)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  פתיחת התמונה
                </a>
              </div>
            </div>
          </div>

          <div className="product-field product-field--stacked">
            <h4 className="product-field__label">קונים (הזמנות)</h4>
            <div className="buyers-table-wrap">
              <table className="buyers-table">
                <thead>
                  <tr>
                    <th scope="col">שם</th>
                    <th scope="col">מידה</th>
                    <th scope="col">גוון</th>
                    <th scope="col" className="buyers-table__qty">
                      כמות
                    </th>
                    <th scope="col">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers
                    .filter((buyer) => buyer.productId === product.id)
                    .map((buyer) => (
                      <tr key={`${buyer.lineKey}-${buyer.userId}-${buyer.date}`}>
                        <td>{buyer.fullName}</td>
                        <td className="buyers-table__qty">{buyer.displaySize}</td>
                        <td>{buyer.displayVariant}</td>
                        <td className="buyers-table__qty">{buyer.qty}</td>
                        <td className="buyers-table__date">{formatDate(buyer.date)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="product-card__actions">
            <button
              type="button"
              className="product-card__delete"
              onClick={() => handleDeleteProductClick(product)}
            >
              מחק מוצר
            </button>
            <button
              type="button"
              className="product-card__save"
              onClick={() => handleSaveProduct(product)}
            >
              שמירה
            </button>
          </div>
        </div>
      ))}

      <div className="add-new-container">
        <button type="button" className="add-new-button" onClick={handleAddNewProduct}>
          הוסף מוצר
        </button>
      </div>
      </div>

      {confirmDeleteProduct &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="admin-confirm-overlay"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDeleteConfirm();
            }}
          >
            <div
              className="admin-confirm-card"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="admin-delete-confirm-title"
              aria-describedby="admin-delete-confirm-desc"
            >
              <h3 id="admin-delete-confirm-title" className="admin-confirm-title">
                מחיקת מוצר
              </h3>
              <p id="admin-delete-confirm-desc" className="admin-confirm-lede">
                האם ברצונך למחוק את המוצר?
              </p>
              {(confirmDeleteProduct.productName || "").trim() ? (
                <p className="admin-confirm-name">
                  {(confirmDeleteProduct.productName || "").trim()}
                </p>
              ) : (
                <p className="admin-confirm-muted">מוצר ללא שם</p>
              )}
              <div className="admin-confirm-actions">
                <button
                  type="button"
                  className="admin-confirm-cancel"
                  onClick={closeDeleteConfirm}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  className="admin-confirm-danger"
                  onClick={handleConfirmDeleteFinal}
                >
                  מחק
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default Products;