import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js"; // ✅ FIXED: Import `getDocs`, `query`, `orderBy`, `limit`

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

// ✅ Fetch Teacher's Assigned Class & Subject
async function getTeacherData(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("🔥 Firestore Teacher Data:", userData); // ✅ Debug Log

        return {
            className: userData.class || "unknown_class",
            subjectName: userData.subject || "unknown_subject"
        };
    } else {
        console.warn("🚨 No class/subject assigned to this teacher!");
        return null;
    }
}

// ✅ Extract YouTube Video ID from URL
function extractVideoId(url) {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/) || 
                  url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&]+)/);
    return match ? match[1] : null;
}

// ✅ Handle Video Submission
document.getElementById("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const videoTitle = document.getElementById("videoTitle").value.trim();
    const youtubeLink = document.getElementById("youtubeLink").value.trim();
    const pdfLink = document.getElementById("pdfLink").value.trim();

    // ✅ Ensure `videoId` is correctly extracted before using it
    const videoId = extractVideoId(youtubeLink);
    if (!videoId) {
        document.getElementById("uploadStatus").textContent = "🚨 Invalid YouTube Link!";
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const teacherData = await getTeacherData(user);
            if (!teacherData || teacherData.subjectName === "unknown_subject") {
                document.getElementById("uploadStatus").textContent = "🚨 No subject found!";
                return;
            }

            const subjectCollection = `${teacherData.subjectName}_${teacherData.className}`;
            const teacherRef = doc(db, "classes", subjectCollection, "teachers", user.uid);

            // ✅ Ensure teacher document exists before adding recordings
            await setDoc(teacherRef, { initialized: true }, { merge: true });

            const recordingsRef = collection(db, "classes", subjectCollection, "teachers", user.uid, "recordings");

            // ✅ Force creation of the "recordings" collection before adding documents
            await setDoc(doc(recordingsRef, "initial"), { initialized: true }, { merge: true });

            console.log("🔥 Writing to Firestore path:", recordingsRef.path); // ✅ Debugging Log

            const recordingId = `${new Date().getTime()}`;

            try {
                await setDoc(doc(recordingsRef, recordingId), { 
                    title: videoTitle,
                    videoId: videoId,  // ✅ `videoId` now correctly assigned
                    pdfLink: pdfLink,
                    uploadedBy: user.email,
                    timestamp: new Date()
                });

                console.log("🔥 Successfully written to:", recordingsRef.path); // ✅ Debugging Log
                document.getElementById("uploadStatus").textContent = "✅ Successfully uploaded!";
            } catch (error) {
                console.error("🚨 Firestore Upload Error:", error);
                document.getElementById("uploadStatus").textContent = "🚨 Upload failed!";
            }
        } else {
            document.getElementById("uploadStatus").textContent = "🚨 User not authenticated!";
        }
    });
});

// ✅ Fetch Latest Topic for Students
async function loadContent(user) {
    if (!user) {
        console.warn("🚨 User not authenticated. Redirecting...");
        window.location.href = "login.html";
        return;
    }

    const teacherData = await getTeacherData(user);
    if (!teacherData) {
        document.getElementById("statusMessage").textContent = "🚨 No class found for this teacher!";
        return;
    }

    const subjectCollection = `${teacherData.subjectName}_${teacherData.className}`;
    const teacherRef = doc(db, "classes", subjectCollection, "teachers", user.uid);
    const recordingsRef = collection(teacherRef, "recordings");

    try {
        const querySnap = await getDocs(query(recordingsRef, orderBy("timestamp", "desc"), limit(1)));

        if (!querySnap.empty) {
            querySnap.forEach(doc => {
                const data = doc.data();

                const topicTitleEl = document.getElementById("topicTitle");
                if (topicTitleEl) topicTitleEl.textContent = data.title || "🚨 No topic available.";

                const videoContainerEl = document.getElementById("videoContainer");
                if (videoContainerEl) {
                    videoContainerEl.innerHTML = data.videoId
                        ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${data.videoId}" 
                           title="${data.title}" frameborder="0" allowfullscreen></iframe>`
                        : "<p>🚨 No recording available.</p>";
                }

                const pdfLinkEl = document.getElementById("pdfLink");
                if (pdfLinkEl) {
                    pdfLinkEl.href = data.pdfLink;
                    pdfLinkEl.textContent = data.pdfLink ? "📂 Download Notes PDF" : "🚨 No notes available.";
                    pdfLinkEl.style.display = data.pdfLink ? "block" : "none";
                }
            });
        } else {
            console.warn("🚨 No updates found.");
        }
    } catch (error) {
        console.error("🚨 Firestore fetch error:", error.message);
    }
}

// ✅ Authenticate User Before Fetching Data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadContent(user);
    } else {
        window.location.href = "login.html";
    }
});