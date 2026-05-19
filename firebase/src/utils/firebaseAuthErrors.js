export function firebaseAuthErrorHe(error, fallback = "פעולה נכשלה.") {
  const codeFull = typeof error?.code === "string" ? error.code : "";
  const code = codeFull.startsWith("auth/") ? codeFull.slice("auth/".length) : "";

  switch (code) {
    case "invalid-email":
      return "כתובת דואר לא תקינה.";
    case "user-disabled":
      return "החשבון הושבת.";
    case "user-not-found":
      return "לא נמצא משתמש עם דואר כזה.";
    case "wrong-password":
      return "סיסמה שגויה.";
    case "invalid-credential":
    case "invalid-login-credentials":
      return "כתובת דואר או סיסמה שגויים.";
    case "email-already-in-use":
      return "כתובת הדואר כבר רשומה.";
    case "weak-password":
      return "יש לבחור סיסמה חזקה יותר (לפחות 6 תווים).";
    case "requires-recent-login":
      return "יש להתנתק ולהתחבר מחדש כדי לבצע שינוי זה.";
    default: {
      if (code) return fallback;
      const raw = typeof error?.message === "string" ? error.message.trim() : "";
      return raw || fallback;
    }
  }
}
