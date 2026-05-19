# Fashion storefront · React + Firebase

RTL-first fashion retail demo: customer catalog with cart & checkout, admin catalog management, and sales dashboards backed by **Firebase Authentication** and **Cloud Firestore**.

---

## Highlights

- **Auth:** Email/password via Firebase Auth; profile documents in Firestore keyed by **`users/{uid}`** (same UID as Auth).
- **Customer:** Browse/filter catalog, product drawer with sizes & display variants, cart keys encode **product + size + variant**, checkout uses a **Firestore transaction** (stock decrement + order record).
- **Admin:** Categories CRUD, products with **per-size stock**, optional image upload to **ImgBB** (URL stored in Firestore), buyers table from carts, **Chart.js** statistics with live listeners.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 19, React Router 7 |
| Build | Vite 6 |
| Backend | Firebase Auth, Cloud Firestore |
| Charts | Chart.js, react-chartjs-2 |
| Images | ImgBB API (+ local bundled assets under `src/pictures/` as legacy keys) |

---

## Firestore collections (conceptual)

| Collection | Purpose |
|------------|---------|
| `users` | Profile: `fullName`, `email`, `role` (`admin` \| `customer`), preferences, etc. **Document ID = Auth UID.** |
| `categories` | Product categories |
| `products` | Catalog fields + `sizeStock` map + `imageLink` (HTTPS or local map key) |
| `shoppingCarts` | Completed orders / snapshots: `userId`, `items`, `purchaseDate`, `finalPrice` |

---

## Prerequisites

- Node.js **18+** recommended  
- A Firebase project with **Firestore** and **Authentication (Email/Password)** enabled  
- (Optional) **ImgBB** API key for admin uploads  

---

## Local setup

```bash
cd firebase
npm install
```

Copy the environment template and fill **Firebase Web config** (and optionally ImgBB):

```bash
cp .env.example .env.local
```

In **Firebase Console → Project settings → Your apps → Firebase SDK snippet**, copy each field into `.env.local`:

| Env variable | SDK config key |
|----------------|----------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `measurementId` (optional) |

Optional: `VITE_IMGBB_API_KEY` for admin image uploads.

Restart `npm run dev` after editing `.env.local`.

Dev server (includes Vite proxy `/imgbb-api` → ImgBB for smoother local uploads):

```bash
npm run dev
```

Other scripts:

```bash
npm run build    # production bundle
npm run lint     # ESLint
npm run preview  # preview production build
```

---

## Firebase console checklist

1. **Authentication → Sign-in method:** enable **Email/Password**.
2. **Firestore:** create database if needed (same Firebase project as in your `.env.local` Web config).
3. **Admin user:**
   - Add a user under **Authentication → Users** (email + password).
   - Copy that user’s **UID**.
   - In Firestore collection **`users`**, create document **`{that UID}`** with at least:
     - `fullName` (string)
     - `email` (string, same as Auth)
     - `role`: `"admin"`
     - optionally `joinAt` as timestamp  

Customers can self-register from the app; their profile is created at `users/{uid}` without storing passwords in Firestore.

---

## Project layout (`src/`)

```
src/
├── App.jsx                 # Routes + auth state (onAuthStateChanged + profile fetch)
├── main.jsx                # Root render, Router, ToastProvider
├── firebase/firebaseConfig.js
├── components/
│   ├── Auth/               # Login, Register
│   ├── Admin/              # Categories, Products, Customers, Statistics, AdminNav
│   ├── Customer/           # Catalog/cart, MyAccount, MyOrders, CustomerNav
│   └── Shared/             # Home landing
├── context/                # Toast provider + hook + context ref
├── utils/                  # cart keys, stock helpers, ImgBB upload, auth error mapping
├── constants/              # Standard sizes list
├── styles/                 # CSS modules per area
└── pictures/               # Static catalog images (legacy keys)
```

---

## Security & production notes

- **Firestore Security Rules** should restrict reads/writes by role and UID; this repo assumes you configure rules in the Firebase console.
- Firebase Web config is loaded from **`VITE_FIREBASE_*`** at build/dev time and still ships in the browser bundle; GitHub secret scanning is less likely to flag literals in repo code. Protection remains **Firestore rules**, App Check (optional), and tight IAM where relevant.
- Never commit `.env.local`; `.env.example` lists keys without values (already ignored patterns in `.gitignore`).

---

## Hebrew · הגדרות מהירות

1. בקונסולת Firebase: **Authentication** → הפעלת **דוא\"ל וסיסמה**.  
2. פרופיל מנהל: משתמש ב־Authentication → מסמך **`users/{אותו UID}`** עם **`role: "admin"`**.  
3. משתמשים ישנים עם פרופיל בלבד ב־Firestore בלי Auth לא ייכנסו עד שיווצר להם משתמש Auth ומסמך מתאים.

---

## License

Private / educational — adjust as needed for your portfolio.
