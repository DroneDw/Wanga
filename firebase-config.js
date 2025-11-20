import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Firebase Config (Use your credentials)
const firebaseConfig = {
    apiKey: "AIzaSyCVMo8f8Fghlv7qXH1TykjPwpfJCE7jr4M",
    authDomain: "wanga-28f2e.firebaseapp.com",
    projectId: "wanga-28f2e",
    storageBucket: "wanga-28f2e.appspot.com",
    messagingSenderId: "530806303421",
    appId: "1:530806303421:web:8f59f74b1385b787c2e5d4" // Replace with your actual App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
