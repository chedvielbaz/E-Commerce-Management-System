import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import "../../styles/Auth.css";

const Login = ({ setCurrentUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // מונע רענון דף ברירת מחדל
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("שם המשתמש או הסיסמה שגויים.");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // עדכון ה-currentUser
      const user = { id: userDoc.id, ...userData };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user)); // שמירה ב-localStorage

      if (userData.role === "admin") {
        navigate("/admin/categories");
      } else if (userData.role === "customer") {
        navigate("/customer/my-account");
      } else {
        setError("תפקיד משתמש לא מוגדר.");
      }
    } catch (err) {
      setError("שגיאה בהתחברות: " + err.message);
    }
  };

  return (
    <div className="login">
      <h1>Next Generation e-Commerce</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit">התחבר</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <p>
          משתמש חדש?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            הירשם
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
