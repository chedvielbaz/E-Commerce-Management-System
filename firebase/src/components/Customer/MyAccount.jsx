import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import CustomerNav from "./CustomerNav"; // ייבוא רכיב הניווט
import "../../styles/Auth.css";
import "../../styles/AdminNav.css";

const MyAccount = ({ currentUser, setCurrentUser }) => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [allowOrderView, setAllowOrderView] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      const storedUser = JSON.parse(localStorage.getItem("currentUser"));
      if (storedUser) {
        setCurrentUser(storedUser);
      } else {
        setError("לא מחובר.");
        navigate("/");
      }
      return;
    }

    const name = currentUser.fullName || currentUser.fullname;
    setFullName(name);

    const shareOrders = currentUser.agreeToShareOrders !== undefined ? currentUser.agreeToShareOrders : currentUser.allowOrderView;
    setAllowOrderView(shareOrders);

    setUsername(currentUser.username);
  }, [currentUser, navigate, setCurrentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        fullName,
        username,
        allowOrderView,
        password, // יש לשקול לא לשמור סיסמאות בצורה זו
      });
      alert("הנתונים עודכנו בהצלחה!");
    } catch (err) {
      setError("שגיאה בעדכון הנתונים: " + err.message);
    }
  };

  if (!currentUser && !localStorage.getItem("currentUser")) {
    return <p>טוען...</p>;
  }

  return (
    <div className="register">
      <CustomerNav setCurrentUser={setCurrentUser} className="admin-nav" /> {/* הוספת רכיב הניווט */}
      <h2>שלום לקוח</h2>
      <h1>החשבון שלי</h1>
      <form className="register-form" onSubmit={handleUpdate}>
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
          placeholder="סיסמה (אם ברצונך לשנות)"
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
        <button type="submit">שמור שינויים</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
};

export default MyAccount;