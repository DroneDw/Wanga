import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Load environment variables (if using Node.js)
import 'dotenv/config';

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 Test Firestore Connection
async function testFirestore() {
    try {
        const docRef = doc(db, "auth", "tokens");
        const docSnap = await getDoc(docRef);
        console.log("✅ Firestore Test:", docSnap.exists() ? "Document Found!" : "Document Missing!");
    } catch (error) {
        console.error("❌ Firestore Connection Error:", error.message);
    }
}

testFirestore();
