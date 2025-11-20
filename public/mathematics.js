import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
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

// ✅ Fetch Topic, Notes, Meeting Link & PDF
async function loadContent(user) {
    if (!user) {
        console.warn("🚨 User not authenticated. Redirecting to login.");
        window.location.href = "login.html"; // 🔥 Redirect unauthorized users to login
        return;
    }

    try {
        const docRef = doc(db, "classes", "math");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("topicTitle").textContent = data.topic || "🚨 No topic available.";
            document.getElementById("topicNotes").textContent = data.notes || "🚨 No notes available.";
            
            // ✅ Display Meeting Link
            if (data.link && data.link.trim() !== "") {
                document.getElementById("meetLink").href = data.link;
                document.getElementById("meetLink").textContent = "🔗 Join Mathematics Live Session";
                document.getElementById("meetLink").style.display = "block";
                console.log("✅ Meeting Link Retrieved:", data.link);
            } else {
                document.getElementById("meetLink").style.display = "none";
            }

            // ✅ Display PDF Link
            if (data.pdfLink && data.pdfLink.trim() !== "") {
                document.getElementById("pdfLink").href = data.pdfLink;
                document.getElementById("pdfLink").textContent = "📂 Download Notes PDF";
                document.getElementById("pdfLink").style.display = "block";
                console.log("✅ PDF Link Retrieved:", data.pdfLink);
            } else {
                document.getElementById("pdfLink").style.display = "none";
            }
        } else {
            console.warn("🚨 No document found for Mathematics.");
        }
    } catch (error) {
        console.error("🚨 Firestore fetch error:", error.message);
    }
}

// ✅ Authenticate User Before Fetching Data
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadContent(user);
    } else {
        window.location.href = "login.html";
    }
});