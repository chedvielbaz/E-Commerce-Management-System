import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-hero">
        <p className="home-brand">THE EDIT</p>
        <span className="home-badge">חוויית שופינג</span>
        <h1>הפריטים שבחרת — במקום אחד</h1>
        <p className="home-lead">
          קטלוג מסודר, עגלת קניות רציפה ומעקב הזמנות שקט — בדיוק הרוח הנקייה והמינימליסטית של חנויות האופנה המובילות היום.
        </p>
        <div className="home-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/app/login")}
          >
            כניסה
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/app/register")}
          >
            הרשמה
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
