import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { firebaseAuthErrorHe } from "../../utils/firebaseAuthErrors";
import "../../styles/Auth.css";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allowOrderView, setAllowOrderView] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      if (!email.trim() || !fullName.trim() || !password) {
        setError("כל השדות הם חובה.");
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          fullName: fullName.trim(),
          email: normalizedEmail,
          role: "customer",
          joinAt: Timestamp.now(),
          allowOrderView,
        });
      } catch (inner) {
        await deleteUser(cred.user).catch(() => {});
        throw inner;
      }

      await signOut(auth);
      navigate("/app/login");
    } catch (err) {
      setError(`שגיאה בהרשמה: ${firebaseAuthErrorHe(err, err?.message ?? "")}`);
    }
  };

  return (
    <div className="auth-page auth-page--register">
      <aside className="auth-panel auth-panel--visual" aria-hidden="true">
        <div className="auth-panel__inner">
          <p className="auth-panel__brand">THE EDIT</p>
          <h2 className="auth-panel__tagline">הצטרפו לקהילת הלקוחות — קנייה וניהול הזמנות במקום אחד.</h2>
          <ul className="auth-panel__bullets">
            <li>פרופיל אישי ומעקב אחרי רכישות</li>
            <li>גישה מלאה לקטלוג</li>
            <li>שקיפות לגבי פרטיות ההזמנות</li>
          </ul>
        </div>
      </aside>

      <main className="auth-panel auth-panel--form">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-back">
            חזרה לדף הבית
          </Link>
          <header className="auth-form-head">
            <p className="auth-form-head__eyebrow">חשבון חדש</p>
            <h1 className="auth-form-head__title">הצטרפות</h1>
            <p className="auth-form-head__sub">יצירת חשבון לקוח</p>
          </header>
          <form className="register-form" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <input
              type="text"
              placeholder="שם מלא"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="email"
              placeholder="כתובת דואר"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="סיסמה (לפחות 6 תווים)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <button type="submit">יצירת חשבון</button>
            {error && <p className="form-error">{error}</p>}
            <p className="auth-switch">
              כבר יש לך חשבון?{" "}
              <span
                role="button"
                tabIndex={0}
                className="auth-switch__link"
                onClick={() => navigate("/app/login")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/app/login");
                  }
                }}
              >
                כניסה
              </span>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
