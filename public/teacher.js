import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

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
const storage = getStorage(app);

// ✅ Handle Topic, Notes & PDF Upload
document.getElementById("uploadBtn").addEventListener("click", async () => {
    const topicTitle = document.getElementById("topicTitle").value.trim();
    const topicNotes = document.getElementById("topicNotes").value.trim();
    const pdfFile = document.getElementById("pdfUpload").files[0];

    if (!topicTitle || !topicNotes || !pdfFile) {
        document.getElementById("statusMessage").textContent = "🚨 Please enter a topic, notes, and select a PDF!";
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const storageRef = ref(storage, `topics/${user.uid}/${pdfFile.name}`);
                await uploadBytes(storageRef, pdfFile);
                const pdfURL = await getDownloadURL(storageRef);

                // ✅ Save topic, notes & PDF link in Firestore
                await setDoc(doc(db, "classes", "math"), {
                    topic: topicTitle,
                    notes: topicNotes,
                    pdfLink: pdfURL,
                    updatedBy: user.email,
                    updatedAt: new Date()
                });

                document.getElementById("statusMessage").textContent = "✅ Topic, Notes & PDF uploaded successfully!";
                console.log("✅ PDF URL:", pdfURL);
            } catch (error) {
                document.getElementById("statusMessage").textContent = "🚨 Upload failed!";
                console.error("🚨 Upload error:", error.message);
            }
        } else {
            document.getElementById("statusMessage").textContent = "🚨 User not authenticated!";
        }
    });
});