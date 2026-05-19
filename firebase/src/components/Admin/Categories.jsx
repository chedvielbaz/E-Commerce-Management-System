import React, { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "../../styles/Global.css";
import "../../styles/AdminNav.css";
import AdminNav from "./AdminNav";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

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

  const handleAddCategory = async () => {
    if (newCategory.trim() === "") return;
    const categoriesCollection = collection(db, "categories");
    const newDoc = await addDoc(categoriesCollection, { categoryName: newCategory });
    setCategories((prev) => [...prev, { id: newDoc.id, categoryName: newCategory }]);
    setNewCategory("");
  };

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

  const handleDeleteCategory = async (id) => {
    const categoryDoc = doc(db, "categories", id);
    await deleteDoc(categoryDoc);
    setCategories((prev) => prev.filter((category) => category.id !== id));
  };

  return (
    <div className="page-shell categories-page">
      <AdminNav />

      <header className="page-head">
        <span className="page-head__eyebrow">ניהול חנות</span>
        <h1 className="page-head__title">קטגוריות</h1>
        <p className="page-head__sub">הוספה, עריכה ומחיקה של קטגוריות למוצרים</p>
      </header>

      <div className="category-toolbar surface surface--pad">
        <input
          type="text"
          placeholder="שם קטגוריה חדשה"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button type="button" className="btn-primary btn-sm" onClick={handleAddCategory}>
          הוסף קטגוריה
        </button>
      </div>

      <ul className="category-list">
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
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => handleUpdateCategory(category.id)}
              >
                שמור
              </button>
            ) : (
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => {
                  setEditingCategoryId(category.id);
                  setEditingCategoryName(category.categoryName);
                }}
              >
                ערוך
              </button>
            )}
            <button
              type="button"
              className="btn-danger btn-sm"
              onClick={() => handleDeleteCategory(category.id)}
            >
              מחק
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;
