import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// ✅ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVMo8f8Fghlv7qXH1TykjPwpfJCE7jr4M",
    authDomain: "wanga-28f2e.firebaseapp.com",
    projectId: "wanga-28f2e",
    storageBucket: "wanga-28f2e.appspot.com",
    messagingSenderId: "530806303421",
    appId: "1:530806303421:web:8f59f74b1385b787c2e5d4"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Handle Login for Both Teachers & Verifiers
document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("teacherEmail").value.trim();
    const password = document.getElementById("teacherPassword").value.trim();

    if (!email || !password) {
        document.getElementById("statusMessage").textContent = "🚨 Please enter your email and password!";
        return;
    }

    try {
        // ✅ Authenticate User
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Fetch User Data from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const role = userData.role || ""; // 🔥 Get user role

            document.getElementById("statusMessage").textContent = "✅ Login successful! Redirecting...";
            console.log(`✅ Logged In: ${email}, Role: ${role}`);

            // ✅ Redirect based on role
            setTimeout(() => {
                if (role === "teacher") {
                    const subject = userData.subject || "dashboard";
                    const teacherClass = userData.class || "";
                    window.location.href = teacherClass ? `${subject}_${teacherClass}_teacher.html` : `${subject}_teacher.html`;
                } else if (role === "verifier") {
                    window.location.href = "verify_payment.html";
                } else {
                    document.getElementById("statusMessage").textContent = "🚨 Unauthorized access!";
                    console.warn("🚨 Unknown role:", email);
                }
            }, 2000);
        } else {
            document.getElementById("statusMessage").textContent = "🚨 No registered account found!";
            console.warn("🚨 User not found in database:", email);
        }
    } catch (error) {
        document.getElementById("statusMessage").textContent = "🚨 Login failed!";
        console.error("🚨 Login error:", error.message);
    }
});