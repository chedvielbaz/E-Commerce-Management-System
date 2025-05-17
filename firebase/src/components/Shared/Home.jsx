import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <h1>ברוכים הבאים לחנות</h1>
      <div className="buttons">
        <button onClick={() => navigate("/app/login")}>התחברות</button>
        <button onClick={() => navigate("/app/register")}>הרשמה</button>
      </div>
    </div>
  );
};



export default Home;