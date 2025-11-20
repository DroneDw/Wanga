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

// ✅ Fetch Student’s Assigned Class & Teacher
async function getStudentData(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("🔥 Firestore User Data:", userData); // ✅ Debug Log

        // 🔥 Directly log `teacherId` to confirm it's NOT `unknown_teacher`
        if (!userData.teacherId) {
            console.warn("🚨 No teacherId found! Check Firestore.");
            return null;
        }
        
        console.log("✅ Correct teacher ID retrieved:", userData.teacherId);
        
        return {
            className: userData.class || "unknown_class",
            teacherId: userData.teacherId // ✅ Use correct teacher ID
        };
    } else {
        console.warn("🚨 No class found for this student!");
        return null;
    }
}

// ✅ Fetch Latest Recording for Students
async function loadLatestRecording(user) {
    if (!user) {
        console.warn("🚨 User not authenticated. Redirecting...");
        window.location.href = "login.html";
        return;
    }

    const studentData = await getStudentData(user);
    if (!studentData || !studentData.teacherId) {
        console.warn("🚨 No assigned teacher found!");
        return;
    }

    // ✅ Correct Firestore path structure
    const recordingsRef = collection(db, "classes", studentData.className, "teachers", studentData.teacherId, "recordings");

    console.log("🔥 Fetching recordings from:", recordingsRef.path); // ✅ Debugging Log

    try {
        const querySnap = await getDocs(query(recordingsRef, orderBy("timestamp", "desc"), limit(1)));

        if (!querySnap.empty) {
            querySnap.forEach(doc => {
                console.log("🔥 Retrieved recording:", doc.data());
                displayRecording(doc.data());
            });
        } else {
            console.warn("🚨 No recordings found.");
            document.getElementById("videoContainer").innerHTML = "<p>🚨 No recording available.</p>";
        }
    } catch (error) {
        console.error("🚨 Firestore fetch error:", error.message);
    }
}
// ✅ Function to Display Recording Content
function displayRecording(data) {
    document.getElementById("topicTitle").textContent = data.title || "🚨 No title available.";

    if (data.videoId) {
        document.getElementById("videoContainer").innerHTML = `
            <iframe width="560" height="315" src="https://www.youtube.com/embed/${data.videoId}" 
            title="${data.title}" frameborder="0" allowfullscreen></iframe>
        `;
    } else {
        document.getElementById("videoContainer").innerHTML = "<p>🚨 No recording available.</p>";
    }

    if (data.pdfLink) {
        document.getElementById("pdfLink").href = data.pdfLink;
        document.getElementById("pdfLink").textContent = "📂 Download Notes PDF";
        document.getElementById("pdfLink").style.display = "block";
    } else {
        document.getElementById("pdfLink").style.display = "none";
    }
}

// ✅ Authenticate User Before Fetching Data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadLatestRecording(user);
    } else {
        window.location.href = "login.html";
    }
});