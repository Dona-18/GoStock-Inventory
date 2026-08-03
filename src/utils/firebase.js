import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ─── Firebase Config Placeholders ───────────────────────────────────────────
// Replace these with your actual Firebase project Web App credentials when ready.
const firebaseConfig = {
  apiKey: "AIzaSyAEauEtvt21wR6G3m5cZtRPfpSovpxI8Rg",
  authDomain: "gostock-b2839.firebaseapp.com",
  projectId: "gostock-b2839",
  storageBucket: "gostock-b2839.firebasestorage.app",
  messagingSenderId: "497879405580",
  appId: "1:497879405580:web:4a4fa479cdce11a1c18a29",
  measurementId: "G-4HCH3T9059"
};

// ─── Safety Fallback Check ──────────────────────────────────────────────────
// Returns true if the user has replaced the placeholder credentials.
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.startsWith("YOUR_");

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    // Initialize App (re-use if already active)
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize Firestore. persistentLocalCache relies on IndexedDB, which only
    // exists on web — on iOS/Android it makes every Firestore call fail with
    // "unimplemented", so native uses the default cache (offline copies of
    // products/sales are already kept in AsyncStorage by AppContext).
    db = Platform.OS === 'web'
      ? initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        })
      : initializeFirestore(app, {});

    auth = getAuth(app);
  } catch (e) {
    console.warn("Firebase initialization failed:", e);
    app = null;
    db = null;
    auth = null;
  }
} else {
  console.log("Firebase credentials not configured. GoStock is running in 100% offline-only mode.");
}

export { app, db, auth };
