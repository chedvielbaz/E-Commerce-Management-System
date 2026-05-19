import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { firebaseAuthErrorHe } from "../../utils/firebaseAuthErrors";
import "../../styles/Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!email.trim() || !password) {
        setError("יש למלא דואר וסיסמה.");
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists) {
        await signOut(auth);
        setError("פרופיל המשתמש לא נמצא במערכת. פנה לתמיכה.");
        return;
      }

      const userData = snap.data();
      if (userData.role === "admin") {
        navigate("/admin/categories");
      } else if (userData.role === "customer") {
        navigate("/customer/my-account");
      } else {
        await signOut(auth);
        setError("תפקיד משתמש לא מוגדר.");
      }
    } catch (err) {
      setError(`שגיאה בהתחברות: ${firebaseAuthErrorHe(err, err?.message ?? "")}`);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-panel auth-panel--visual" aria-hidden="true">
        <div className="auth-panel__inner">
          <p className="auth-panel__brand">THE EDIT</p>
          <h2 className="auth-panel__tagline">קולקציה מסודרת. קנייה שקטה. הזמנות ברורות.</h2>
          <ul className="auth-panel__bullets">
            <li>מבחר פריטים מעודכן</li>
            <li>תהליך קנייה רציף בעגלה נקייה</li>
            <li>מעקב אחרי ההזמנות שלך</li>
          </ul>
        </div>
      </aside>

      <main className="auth-panel auth-panel--form">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-back">
            חזרה לדף הבית
          </Link>
          <header className="auth-form-head">
            <p className="auth-form-head__eyebrow">חשבון</p>
            <h1 className="auth-form-head__title">כניסה</h1>
            <p className="auth-form-head__sub">התחברו לחשבון כדי להמשיך בקנייה</p>
          </header>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="כתובת דואר"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button type="submit">התחברות</button>
            {error && <p className="form-error">{error}</p>}
            <p className="auth-switch">
              עדיין אין חשבון?{" "}
              <span
                role="button"
                tabIndex={0}
                className="auth-switch__link"
                onClick={() => navigate("/app/register")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/app/register");
                  }
                }}
              >
                הרשמה
              </span>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
