import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, runTransaction, doc } from "firebase/firestore";
import "../../styles/Global.css";
import "../../styles/AdminNav.css";
import "../../styles/product-drawer.css";
import CustomerNav from "./CustomerNav";
import { useToast } from "../../context/useToast";
import { encodeCartLineKey, parseCartLineKey, variantDisplayHe } from "../../utils/cartLineKey";
import {
  normalizeSizeStock,
  sumSizeStock,
  hasStructuredSizeStock,
  sizesOffered,
  stockForSize,
} from "../../utils/productStock";
import { STANDARD_SIZES } from "../../constants/sizes";
import { resolveProductImageSrc } from "../../utils/productImageSrc";
import blue_shirt from "../../pictures/blue_shirt.png";
import whiteShoes from "../../pictures/white shoes.png";
import black_socks from "../../pictures/black_socks.png";
import black_bag from "../../pictures/black_bag.png";
import black_skirt from "../../pictures/black_skirt.png";
import black_dress from "../../pictures/black_dress.png";
import jins_shirt from "../../pictures/jins_shirt.png";
import brown_shoes from "../../pictures/brown_shoes.png";

function cartQtyForProductSize(cart, productId, size) {
  return Object.entries(cart || {}).reduce((sum, [rawKey, q]) => {
    const parsed = parseCartLineKey(rawKey);
    if (parsed.productId !== productId || parsed.size !== size) return sum;
    return sum + (Number(q) || 0);
  }, 0);
}

function cartQtyForProduct(cart, productId) {
  return Object.entries(cart || {}).reduce((sum, [rawKey, q]) => {
    if (parseCartLineKey(rawKey).productId !== productId) return sum;
    return sum + (Number(q) || 0);
  }, 0);
}

function aggregateCartByProduct(cart) {
  const byProduct = new Map();
  for (const [rawKey, qty] of Object.entries(cart || {})) {
    const n = Math.floor(Math.max(0, Number(qty) || 0));
    if (n <= 0) continue;
    const { productId, size } = parseCartLineKey(rawKey);
    if (!productId) continue;
    if (!byProduct.has(productId)) byProduct.set(productId, []);
    byProduct.get(productId).push({ size, qty: n });
  }
  return byProduct;
}

function mapFirestoreProductDoc(docSnap) {
  const d = docSnap.data();
  let sizeStock = normalizeSizeStock(d.sizeStock);
  if (sumSizeStock(sizeStock) === 0 && Number(d.quantity) > 0) {
    sizeStock = { ...sizeStock, M: Number(d.quantity) };
  }
  return { id: docSnap.id, ...d, sizeStock };
}

const imageMap = {
  blue_shirt: blue_shirt,
  "white shoes": whiteShoes,
  black_socks: black_socks,
  black_bag: black_bag,
  black_skirt: black_skirt,
  black_dress: black_dress,
  brown_shoes: brown_shoes,
  jins_shirt: jins_shirt,
};

const COLOR_VARIANTS = [
  { id: "default", label: "מראה בסיסי", filter: "" },
  { id: "dusk", label: "גוון עמוק", filter: "saturate(0.92) brightness(0.87) contrast(1.02)" },
  { id: "glacier", label: "טון קר ובהיר", filter: "saturate(0.9) brightness(1.05) hue-rotate(-6deg)" },
  { id: "sand", label: "גוון חם", filter: "saturate(1.02) brightness(0.97) sepia(0.08)" },
];

const ProductsCatalog = ({ currentUser }) => {
  const toast = useToast();
  const drawerProductIdRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cart, setCart] = useState({});
  const [detailProduct, setDetailProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedVariant, setSelectedVariant] = useState("default");
  const [modalQty, setModalQty] = useState(1);

  const closeDetail = useCallback(() => {
    setDetailProduct(null);
    setModalQty(1);
  }, []);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [closeDetail]);

  useEffect(() => {
    if (!detailProduct) {
      document.body.style.overflow = "";
      drawerProductIdRef.current = null;
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "hidden";
    if (drawerProductIdRef.current !== detailProduct.id) {
      drawerProductIdRef.current = detailProduct.id;
      setSelectedVariant("default");
      setModalQty(1);
    }

    const live = products.find((p) => p.id === detailProduct.id) || detailProduct;
    const avail = sizesOffered(live);
    setSelectedSize((prev) => (avail.includes(prev) ? prev : avail[0] || ""));

    return () => {
      document.body.style.overflow = "";
    };
  }, [detailProduct, products, cart]);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollection = collection(db, "products");
      const productsSnapshot = await getDocs(productsCollection);
      const productsData = productsSnapshot.docs.map(mapFirestoreProductDoc);
      setProducts(productsData);
      setFilteredProducts(productsData);
    };

    const fetchCategories = async () => {
      const categoriesCollection = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
    };

    fetchProducts();
    fetchCategories();
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

  const filterProducts = (category, search, min, max, productList) => {
    const pool = productList ?? products;
    const filtered = pool.filter((product) => {
      const matchesCategory = category ? product.categoryId === category : true;
      const matchesSearch = (product.productName ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPrice =
        (min === "" || product.price >= Number(min)) &&
        (max === "" || product.price <= Number(max));
      return matchesCategory && matchesPrice && matchesSearch;
    });
    setFilteredProducts(filtered);
  };

  const setLineQuantity = (lineKey, quantity) => {
    setCart((prevCart) => {
      const next = { ...prevCart };
      if (!quantity || quantity <= 0) delete next[lineKey];
      else next[lineKey] = quantity;
      return next;
    });
  };

  const removeFromCart = (lineKey) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[lineKey];
      return next;
    });
  };

  const calculateTotalCost = () => {
    return Object.entries(cart).reduce((total, [rawKey, quantity]) => {
      const { productId } = parseCartLineKey(rawKey);
      const product = products.find((p) => p.id === productId);
      if (!product) return total;
      return total + product.price * (Number(quantity) || 0);
    }, 0);
  };

  const formatCartLineSubtitle = (rawKey) => {
    const { size, variantKey } = parseCartLineKey(rawKey);
    const parts = [];
    if (size) parts.push(`מידה ${size}`);
    if (variantKey && variantKey !== "default") parts.push(variantDisplayHe(variantKey));
    return parts.length ? ` · ${parts.join(" · ")}` : "";
  };

  const tryChangeCartQty = (rawKey, nextRaw) => {
    const next = Math.max(0, Math.floor(Number(nextRaw) || 0));
    const prev = cart[rawKey] || 0;
    if (next <= prev) {
      setLineQuantity(rawKey, next);
      return;
    }
    const delta = next - prev;
    const { productId, size } = parseCartLineKey(rawKey);
    const product = products.find((p) => p.id === productId);
    if (!product) {
      setLineQuantity(rawKey, next);
      return;
    }
    if (hasStructuredSizeStock(product)) {
      const usedSize = cartQtyForProductSize(cart, productId, size);
      if (usedSize + delta > stockForSize(product, size)) {
        toast.info("אין מספיק מלאי למידה הזאת בעגלה.");
        return;
      }
    } else {
      const usedTot = cartQtyForProduct(cart, productId);
      if (usedTot + delta > (Number(product.quantity) || 0)) {
        toast.info("הגעת לתקרת המלאי לפריט הזה בעגלה.");
        return;
      }
    }
    setLineQuantity(rawKey, next);
  };

  const handleOrder = async () => {
    if (!currentUser) {
      toast.info("יש להתחבר כדי לבצע הזמנה.");
      return;
    }

    const userId = currentUser.id;
    const purchaseDate = new Date().toISOString();
    const finalPrice = calculateTotalCost();

    if (finalPrice <= 0) {
      toast.info("העגלה ריקה.");
      return;
    }

    const byProduct = aggregateCartByProduct(cart);
    if (byProduct.size === 0) {
      toast.info("העגלה ריקה.");
      return;
    }

    const orderRef = doc(collection(db, "shoppingCarts"));
    const entries = [...byProduct.entries()].map(([productId, lines]) => ({
      productId,
      lines,
      ref: doc(db, "products", productId),
    }));
    const cartSnapshot = { ...cart };

    try {
      await runTransaction(db, async (transaction) => {
        const rows = [];
        for (const { ref, productId, lines } of entries) {
          const snap = await transaction.get(ref);
          if (!snap.exists) {
            throw new Error("ORDER_PRODUCT_NOT_FOUND");
          }
          rows.push({ ref, productId, lines, data: snap.data() });
        }

        for (const { ref, lines, data } of rows) {
          if (hasStructuredSizeStock(data)) {
            const bad = lines.filter(
              (l) => !l.size || !STANDARD_SIZES.includes(l.size)
            );
            if (bad.length) {
              throw new Error("ORDER_BAD_CART_LINE");
            }
            const sizeStock = normalizeSizeStock(data.sizeStock);
            const bySize = new Map();
            for (const { size, qty } of lines) {
              bySize.set(size, (bySize.get(size) || 0) + qty);
            }
            for (const [size, need] of bySize) {
              const avail = sizeStock[size] ?? 0;
              if (avail < need) {
                throw new Error("ORDER_INSUFFICIENT_STOCK");
              }
              sizeStock[size] = avail - need;
            }
            transaction.update(ref, {
              sizeStock,
              quantity: sumSizeStock(sizeStock),
            });
          } else {
            const totalQty = lines.reduce((sum, { qty }) => sum + qty, 0);
            let q = Number(data.quantity) || 0;
            if (q < totalQty) {
              throw new Error("ORDER_INSUFFICIENT_STOCK");
            }
            transaction.update(ref, { quantity: q - totalQty });
          }
        }

        transaction.set(orderRef, {
          userId,
          purchaseDate,
          items: cartSnapshot,
          finalPrice,
        });
      });

      toast.success(`ההזמנה בוצעה בהצלחה · סך הכל ${finalPrice} ₪`);
      setCart({});

      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map(mapFirestoreProductDoc);
      setProducts(productsData);
      filterProducts(selectedCategory, searchTerm, minPrice, maxPrice, productsData);
    } catch (error) {
      console.error("Error order transaction: ", error);
      const code = error?.message;
      if (code === "ORDER_INSUFFICIENT_STOCK") {
        toast.error("אין מספיק מלאי (יתכן שנרכש במקביל). רעננו את העמוד.");
      } else if (code === "ORDER_PRODUCT_NOT_FOUND") {
        toast.error("מוצר מההזמנה לא נמצא במסד הנתונים.");
      } else if (code === "ORDER_BAD_CART_LINE") {
        toast.error("שורת סל לא תקינה — נסו לרוקן את העגלה ולהוסיף שוב.");
      } else {
        toast.error("שגיאה בביצוע ההזמנה. נסו שוב.");
      }
    }
  };

  const currentFilter =
    COLOR_VARIANTS.find((v) => v.id === selectedVariant)?.filter || "";

  const openDetail = (product) => setDetailProduct(product);

  const addFromDrawer = () => {
    if (!detailProduct) return;
    const prod =
      products.find((p) => p.id === detailProduct.id) || detailProduct;
    const allowed = sizesOffered(prod);
    if (allowed.length === 0) {
      toast.info("הפריט אזל מהמלאי.");
      return;
    }
    if (!selectedSize || !allowed.includes(selectedSize)) {
      toast.info("בחרו מידה זמינה.");
      return;
    }
    const want = modalQty <= 0 ? 1 : modalQty;
    let maxAdd = 0;
    if (hasStructuredSizeStock(prod)) {
      maxAdd = Math.max(
        0,
        stockForSize(prod, selectedSize) -
          cartQtyForProductSize(cart, prod.id, selectedSize)
      );
    } else {
      maxAdd = Math.max(
        0,
        (Number(prod.quantity) || 0) - cartQtyForProduct(cart, prod.id)
      );
    }
    if (want > maxAdd) {
      toast.info(`אפשר להוסיף כרגע עד ${maxAdd} יח׳ לפי המלאי.`);
      return;
    }
    const lineKey = encodeCartLineKey(prod.id, selectedSize, selectedVariant);
    setLineQuantity(lineKey, (cart[lineKey] || 0) + want);
    toast.success("נוסף לעגלת הקניות.");
    closeDetail();
  };

  const drawerLive =
    detailProduct &&
    (products.find((pr) => pr.id === detailProduct.id) || detailProduct);

  let drawerQtyCap = 0;
  if (drawerLive && selectedSize) {
    if (hasStructuredSizeStock(drawerLive)) {
      drawerQtyCap = Math.max(
        0,
        stockForSize(drawerLive, selectedSize) -
          cartQtyForProductSize(cart, drawerLive.id, selectedSize)
      );
    } else {
      drawerQtyCap = Math.max(
        0,
        (Number(drawerLive.quantity) || 0) - cartQtyForProduct(cart, drawerLive.id)
      );
    }
  }

  const detailOverlay =
    drawerLive &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="product-drawer-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-drawer-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDetail();
        }}
      >
        <div className="product-drawer">
          <div className="product-drawer__gallery">
            <div className="product-drawer__main-media">
              <img
                src={resolveProductImageSrc(drawerLive.imageLink, imageMap)}
                alt={drawerLive.productName}
                style={{ filter: currentFilter }}
              />
            </div>
            <div className="product-drawer__thumbs" role="list">
              {COLOR_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="listitem"
                  className={`product-drawer__thumb-btn${selectedVariant === v.id ? " is-selected" : ""}`}
                  title={v.label}
                  aria-label={v.label}
                  onClick={() => setSelectedVariant(v.id)}
                >
                  <img
                    src={resolveProductImageSrc(drawerLive.imageLink, imageMap)}
                    alt=""
                    style={{ filter: v.filter }}
                  />
                  <span className="product-drawer__thumb-label">{v.label}</span>
                </button>
              ))}
            </div>

            <p className="product-drawer-thumb-hint">
              גרסאות מראה — אותו צילום עם טון שונה (להמחשה)
            </p>
          </div>

          <div className="product-drawer__panel">
            <div className="product-drawer__close-bar">
              <button
                type="button"
                className="product-drawer__close-btn"
                onClick={closeDetail}
              >
                סגירה ✕
              </button>
            </div>

            <p className="product-drawer__eyebrow">קולקציה</p>
            <h2 id="product-drawer-title" className="product-drawer__title">
              {drawerLive.productName}
            </h2>

            <div className="product-drawer__price-row">
              <span className="product-drawer__price">{drawerLive.price} ₪</span>
            </div>

            <div className="product-drawer__section-title">תיאור</div>
            <p className="product-drawer__desc">
              {drawerLive.description?.trim() ||
                "תיאור טקסטואלי ארוך — חומר, גזרה ודגשים בסגנון תצוגות קנייה. ניתן לעדכן את התיאור בניהול המוצר."}
            </p>

            <div className="product-drawer__section-title">בחירת מידה</div>
            <div className="product-drawer__sizes">
              {sizesOffered(drawerLive).length === 0 ? (
                <p className="product-drawer__empty-stock">המוצר אזל מהמלאי.</p>
              ) : (
                sizesOffered(drawerLive).map((size) => (
                  <button
                    key={size}
                    type="button"
                    title={
                      hasStructuredSizeStock(drawerLive)
                        ? `במלאי: ${stockForSize(drawerLive, size)}`
                        : ""
                    }
                    className={`product-drawer__chip${selectedSize === size ? " is-selected" : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))
              )}
            </div>

            <div className="product-drawer__actions">
              <div className="product-drawer__qty">
                <button type="button" onClick={() => setModalQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{modalQty}</span>
                <button
                  type="button"
                  onClick={() => setModalQty((q) => q + 1)}
                  disabled={drawerQtyCap === 0 || modalQty >= drawerQtyCap}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="product-drawer__add-cart btn-primary"
                onClick={addFromDrawer}
                disabled={sizesOffered(drawerLive).length === 0 || drawerQtyCap === 0}
              >
                הוסף לסל
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="page-shell products-catalog">
      <div className="customer-nav-wrap">
        <CustomerNav />
      </div>

      <header className="page-head">
        <span className="page-head__eyebrow">אזור לקוח</span>
        <h1 className="page-head__title">קטלוג מוצרים</h1>
        <p className="page-head__sub">
          לחצו על פריט לתצוגה מלאה, מידות וגרסאות מראה
        </p>
      </header>

      <div className="filter-bar">
        <select onChange={handleCategoryChange}>
          <option value="">כל הקטגוריות</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryName}
            </option>
          ))}
        </select>
        <input type="text" placeholder="חפש לפי שם מוצר" value={searchTerm} onChange={handleSearchChange} />
        <input type="number" placeholder="מחיר מינימלי" value={minPrice} onChange={handleMinPriceChange} />
        <input type="number" placeholder="מחיר מקסימלי" value={maxPrice} onChange={handleMaxPriceChange} />
      </div>

      {detailOverlay}

      <div className="catalog-container">
        <div className="products-list">
          {filteredProducts.map((product) => (
            <article key={product.id} className="product-item product-item-clickable">
              <button
                type="button"
                className="product-card-tile"
                onClick={() => openDetail(product)}
                aria-haspopup="dialog"
              >
                <h2>{product.productName}</h2>
                <div className="product-item__media">
                  <img
                    src={resolveProductImageSrc(product.imageLink, imageMap)}
                    alt={product.productName}
                  />
                </div>
                <p className="product-item__peek">מידה · גרסאות צבע — לפתיחת עמוד פריט</p>
                <p>{product.price} ₪</p>
              </button>
            </article>
          ))}
        </div>

        <div className="cart">
          <h2>עגלת הקניות</h2>
          {Object.keys(cart).map((rawKey) => {
            const { productId } = parseCartLineKey(rawKey);
            const product = products.find((p) => p.id === productId);
            return (
              <div key={rawKey} className="cart-item">
                <button type="button" onClick={() => removeFromCart(rawKey)} aria-label="הסרה">
                  ×
                </button>
                <div className="cart-item__lines">
                  <span>
                    {product?.productName}
                    {formatCartLineSubtitle(rawKey)}
                  </span>
                  <span>
                    בסל {cart[rawKey]} יח׳ × {product?.price} ₪
                  </span>
                </div>
                <div className="quantity-selector">
                  <button
                    type="button"
                    onClick={() =>
                      tryChangeCartQty(rawKey, Math.max((cart[rawKey] || 1) - 1, 0))
                    }
                  >
                    −
                  </button>
                  <span>{cart[rawKey]}</span>
                  <button
                    type="button"
                    onClick={() =>
                      tryChangeCartQty(rawKey, (cart[rawKey] || 0) + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}

          <h3>סך הכל: {calculateTotalCost()} ₪</h3>
          <button type="button" className="btn-order" onClick={handleOrder}>
            בצע הזמנה
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsCatalog;
