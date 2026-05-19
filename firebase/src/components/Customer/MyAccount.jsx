import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import CustomerNav from "./CustomerNav";
import "../../styles/Auth.css";
import "../../styles/AdminNav.css";
import { useToast } from "../../context/useToast";
import { firebaseAuthErrorHe } from "../../utils/firebaseAuthErrors";

const MyAccount = ({ currentUser, setCurrentUser }) => {
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [allowOrderView, setAllowOrderView] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    const name = currentUser.fullName || currentUser.fullname;
    setFullName(name);

    const shareOrders =
      currentUser.agreeToShareOrders !== undefined
        ? currentUser.agreeToShareOrders
        : currentUser.allowOrderView;
    setAllowOrderView(shareOrders);
    setNewPassword("");
    setError("");
  }, [currentUser, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!currentUser?.id || !auth.currentUser) return;

      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        fullName,
        allowOrderView,
      });

      const next = { ...currentUser, fullName, allowOrderView };
      delete next.password;

      const trimmedPw = newPassword.trim();
      if (trimmedPw) {
        if (trimmedPw.length < 6) {
          setError("סיסמה חדשה צריכה לכלול לפחות 6 תווים.");
          return;
        }
        await updatePassword(auth.currentUser, trimmedPw);
        setNewPassword("");
      }

      setCurrentUser(next);
      toast.success("הנתונים עודכנו בהצלחה.");
    } catch (err) {
      setError(`שגיאה בעדכון הנתונים: ${firebaseAuthErrorHe(err, err?.message ?? "")}`);
      toast.error("לא ניתן לעדכן את הנתונים כרגע.");
    }
  };

  if (!currentUser || !auth.currentUser || auth.currentUser.uid !== currentUser.id) {
    return (
      <div className="page-loading page-shell">
        <p>טוען…</p>
      </div>
    );
  }

  const emailShown = currentUser.email || auth.currentUser.email || "—";

  return (
    <div className="page-shell account-page">
      <div className="customer-nav-wrap">
        <CustomerNav />
      </div>
      <header className="page-head">
        <span className="page-head__eyebrow">אזור לקוח</span>
        <h1 className="page-head__title">החשבון שלי</h1>
        <p className="page-head__sub">עדכון פרטים והעדפות פרטיות</p>
      </header>
      <form className="register-form" onSubmit={handleUpdate}>
        <input
          type="text"
          placeholder="שם מלא"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <p className="form-static-line" style={{ margin: "0.25rem 0", opacity: 0.85 }}>
          דואר: <strong>{emailShown}</strong> (מתעדכן דרך מערכת האימות)
        </p>
        <input
          type="password"
          placeholder="סיסמה חדשה (אופציונלי)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <div>
          <input
            type="checkbox"
            checked={allowOrderView}
            onChange={(e) => setAllowOrderView(e.target.checked)}
          />
          <label>אני מסכים לאחרים לראות את ההזמנות שלי</label>
        </div>
        <button type="submit">שמור שינויים</button>
        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
};

export default MyAccount;
