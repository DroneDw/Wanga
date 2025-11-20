import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

// ✅ Handle Topic, Notes, Meeting Link & Google Drive PDF Submission
document.getElementById("uploadBtn").addEventListener("click", async () => {
    const topicTitle = document.getElementById("topicTitle").value.trim();
    const topicNotes = document.getElementById("topicNotes").value.trim();
    const pdfLink = document.getElementById("pdfLink").value.trim();
    const meetLink = document.getElementById("meetLink").value.trim(); // ✅ Added meeting link input

    if (!topicTitle || !topicNotes || !pdfLink || !meetLink) {
        document.getElementById("statusMessage").textContent = "🚨 Please enter a topic, notes, a Google Drive PDF link, and a meeting link!";
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().isTeacher) {
                try {
                    // ✅ Save topic, notes, PDF link & meeting link in Firestore
                    await setDoc(doc(db, "classes", "math"), {
                        topic: topicTitle,
                        notes: topicNotes,
                        pdfLink: pdfLink,  // 🔥 Save Google Drive link
                        link: meetLink,     // 🔥 Save Google Meet link
                        updatedBy: user.email,
                        updatedAt: new Date()
                    });

                    document.getElementById("statusMessage").textContent = "✅ Topic, Notes, Meeting Link & PDF saved successfully!";
                    console.log("✅ Google Drive PDF Link:", pdfLink);
                    console.log("✅ Meeting Link:", meetLink);
                } catch (error) {
                    document.getElementById("statusMessage").textContent = "🚨 Save failed!";
                    console.error("🚨 Firestore error:", error.message);
                }
            } else {
                document.getElementById("statusMessage").textContent = "🚨 Access Denied! You are not a registered teacher.";
                console.warn("🚨 Unauthorized Access Attempt.");
            }
        } else {
            document.getElementById("statusMessage").textContent = "🚨 User not authenticated!";
        }
    });
});