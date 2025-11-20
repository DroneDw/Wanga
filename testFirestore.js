import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCVMo8f8Fghlv7qXH1TykjPwpfJCE7jr4M",
    authDomain: "wanga-456817.firebaseapp.com",
    projectId: "wanga-456817",
    storageBucket: "wanga-456817.appspot.com",
    messagingSenderId: "530806303421",
    appId: "1:530806303421:web:8f59f74b1385b787c2e5d4"
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