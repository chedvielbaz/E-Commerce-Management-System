import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "../../styles/AdminNav.css"; // ייבוא קובץ CSS לעיצוב

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // שליפת קטגוריות מ-Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesCollection = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesList);
    };

    fetchCategories();
  }, []);

  // הוספת קטגוריה חדשה
  const handleAddCategory = async () => {
    if (newCategory.trim() === "") return;
    const categoriesCollection = collection(db, "categories");
    const newDoc = await addDoc(categoriesCollection, { categoryName: newCategory });
    setCategories((prev) => [...prev, { id: newDoc.id, categoryName: newCategory }]);
    setNewCategory("");
  };

  // עדכון שם קטגוריה
  const handleUpdateCategory = async (id) => {
    const categoryDoc = doc(db, "categories", id);
    await updateDoc(categoryDoc, { categoryName: editingCategoryName });
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id
          ? { ...category, categoryName: editingCategoryName }
          : category
      )
    );
  };

  // מחיקת קטגוריה
  const handleDeleteCategory = async (id) => {
    const categoryDoc = doc(db, "categories", id);
    await deleteDoc(categoryDoc);
    setCategories((prev) => prev.filter((category) => category.id !== id));
  };

  return (
    <div className="categories-container">
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
  
      {/* ברכת שלום למנהל */}
      <h2>שלום מנהל</h2>
  
      {/* תוכן הדף */}
      <h1>Categories</h1>
      <div>
        <input
          type="text"
          placeholder="הוסף קטגוריה חדשה"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button onClick={handleAddCategory}>הוסף</button>
      </div>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            {editingCategoryId === category.id ? (
              <input
                type="text"
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
              />
            ) : (
              <span>{category.categoryName}</span>
            )}
            {editingCategoryId === category.id ? (
              <button onClick={() => handleUpdateCategory(category.id)}>
                עדכן
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingCategoryId(category.id);
                  setEditingCategoryName(category.categoryName);
                }}
              >
                ערוך
              </button>
            )}
            <button onClick={() => handleDeleteCategory(category.id)}>
              מחק
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories; // סוגר את הקומפוננטה
