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

// ✅ Function to Retrieve Teacher's Assigned Class
async function getTeacherClass(user) {
    if (!user) return null;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    return userSnap.exists() ? userSnap.data().class : null;
}

// ✅ Handle YouTube Video Upload (Only Video Management)
document.getElementById("uploadVideoBtn").addEventListener("click", async () => {
    const videoTitle = document.getElementById("videoTitle")?.value.trim();
    const videoLink = document.getElementById("videoLink")?.value.trim();
    const videoStatusMessage = document.getElementById("videoStatusMessage");
    const user = auth.currentUser;

    if (!videoTitle || !videoLink) {
        if (videoStatusMessage) videoStatusMessage.textContent = "🚨 Both video title and video link are required!";
        return;
    }

    const teacherClass = await getTeacherClass(user);
    if (!teacherClass) return;

    const subjectCollection = `chemistry_${teacherClass}`;
    const videoId = new URL(videoLink).searchParams.get("v");
    const embedLink = `https://www.youtube.com/embed/${videoId}`;

    try {
        await setDoc(doc(db, "classes", subjectCollection, "topics", topicTitle, "videos", videoTitle), {
            title: videoTitle,
            videoId: videoId
        });

        if (videoStatusMessage) videoStatusMessage.textContent = "✅ Lesson recording saved!";
    } catch (error) {
        console.error("🚨 Firestore write error:", error.message);
        if (videoStatusMessage) videoStatusMessage.textContent = "🚨 Video upload failed!";
    }
});

// ✅ Authenticate User Before Uploads
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
    }
});