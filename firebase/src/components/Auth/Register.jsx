import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import "../../styles/Auth.css";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [allowOrderView, setAllowOrderView] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      if (!username || !fullName || !password) {
        setError("כל השדות הם חובה.");
        return;
      }

      // הוספת פרטי המשתמש ל-Firestore, ללא סיסמה
      await addDoc(collection(db, "users"), {
        fullName,
        username,
        role: "customer", // ברירת מחדל: לקוח
        joinAt: Timestamp.now(), // עדכון לשימוש ב-Timestamp
        allowOrderView,
        password, // הוספת סיסמה ל-Firestore (לא מומלץ לשמור סיסמאות בצורה זו)
      });

      // הפניה לדף ההתחברות לאחר הרשמה מוצלחת
      navigate("/login");
    } catch (err) {
      setError("שגיאה בהרשמה: " + err.message);
    }
  };

  return (
    <div className="register">
      <h1>New User Register</h1>
      <form className="register-form" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
        <input
          type="text"
          placeholder="שם מלא"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div>
          <input
            type="checkbox"
            checked={allowOrderView}
            onChange={(e) => setAllowOrderView(e.target.checked)}
          />
          <label>האם אני מסכים לאחרים לראות את ההזמנות שלי</label>
        </div>
        <button type="submit">Create</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
};

export default Register;
