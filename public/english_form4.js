import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, query, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

// ✅ Fetch Latest Topic for Students with Debugging Logs
async function loadContent(user, subject) { // 🔥 Pass subject dynamically
    if (!user) {
        console.warn("🚨 User not authenticated. Redirecting...");
        window.location.href = "login.html";
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().isTeacher) {
        console.warn("🚨 User is not a student, or their data is missing!");
        return;
    }

    const studentClass = userSnap.data().class;
    const subjectCollection = `${subject}_${studentClass}`; // 🔥 Works for any subject (Biology, Chemistry, etc.)

    console.log("🔥 Fetching teacher updates from:", `classes/${subjectCollection}/teachers`);

    try {
        const teachersCollectionRef = collection(db, "classes", subjectCollection, "teachers");
        const teachersQuerySnapshot = await getDocs(teachersCollectionRef);

        if (teachersQuerySnapshot.empty) {
            console.warn("🚨 No teacher updates found in this collection.");
            return;
        }

        const firstTeacherDoc = teachersQuerySnapshot.docs[0];
        console.log("✅ Fetching updates from teacher:", firstTeacherDoc.id);

        return displayContent(firstTeacherDoc.data());
    } catch (error) {
        console.error("🚨 Firestore fetch error:", error.message);
    }
}

// ✅ Authenticate User Before Fetching Data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadContent(user, "English"); // 🔥 Call for different subjects
    } else {
        window.location.href = "login.html";
    }
});

// ✅ Function to Display Content
function displayContent(data) {
    document.getElementById("topicTitle").textContent = data.topic || "🚨 No topic available.";
    document.getElementById("topicNotes").textContent = data.notes || "🚨 No notes available.";

    if (data.pdfLink) {
        document.getElementById("pdfLink").href = data.pdfLink;
        document.getElementById("pdfLink").textContent = "📂 Download Notes PDF";
        document.getElementById("pdfLink").style.display = "block";
    } else {
        document.getElementById("pdfLink").style.display = "none";
    }

    if (data.meetLink) {
        document.getElementById("meetLink").href = data.meetLink;
        document.getElementById("meetLink").textContent = "🔗 Join Live Session";
        document.getElementById("meetLink").style.display = "block";
    } else {
        document.getElementById("meetLink").style.display = "none";
    }
}

// ✅ Authenticate User Before Fetching Data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const subject = "English"; // 🔥 Ensure subject is set dynamically when calling the function
        await loadContent(user, subject);
    } else {
        window.location.href = "login.html";
    }
});