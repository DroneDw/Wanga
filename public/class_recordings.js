import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit } 
from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

// ✅ Fetch Student's Assigned Class & Teacher
async function getStudentData(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("🔥 Firestore User Data:", userData);

        if (!userData.class) {
            console.warn(`🚨 No class found for student: ${userData.email}. Ensure Firestore has assigned a class.`);
            return null;
        }

        // ✅ Find the teacher assigned to this class inside `users`
        const teachersRef = collection(db, "users");
        const querySnap = await getDocs(query(teachersRef, where("role", "==", "teacher"), where("class", "==", userData.class)));

        if (querySnap.empty) {
            console.warn(`🚨 No teacher found for class: ${userData.class}. Ensure Firestore has linked a teacher.`);
            return null;
        }

        let teacherId;
        querySnap.forEach(doc => {
            teacherId = doc.id; // ✅ Assign teacher's document ID as `teacherId`
        });

        console.log(`✅ Retrieved teacher ID dynamically: ${teacherId}`);

        return {
            className: userData.class || "unknown_class",
            teacherId: teacherId
        };
    } else {
        console.warn(`🚨 No Firestore document found for student: ${user.email}`);
        return null;
    }
}

// ✅ Fetch & Embed Today's Class Session
async function loadTodaysSession(userData) {
    const { className, teacherId } = userData;

    console.log("🔥 Fetching today's recording for class:", className);

    const recordingsRef = collection(db, "classes", className, "teachers", teacherId, "recordings");

    try {
        const querySnap = await getDocs(query(recordingsRef, orderBy("timestamp", "desc"), limit(1)));

        console.log("✅ Firestore Query Results:", querySnap.docs.map(doc => doc.id));

        if (!querySnap.empty) {
            const latestRecording = querySnap.docs[0];
            const data = latestRecording.data();

            console.log("🔥 Found Latest Recording:", data);

            // ✅ Ensure elements exist before updating them
            const todayTitleEl = document.getElementById("todayTitle");
            const todayContainerEl = document.getElementById("todayRecordingContainer");
            const todayPdfLinkEl = document.getElementById("todayPdfLink");

            if (todayTitleEl) todayTitleEl.innerHTML = `<strong>${data.title}</strong>`;
            if (todayContainerEl) todayContainerEl.innerHTML = `
                <iframe width="560" height="315" src="${data.videoLink}" 
                title="${data.title}" frameborder="0" allowfullscreen></iframe>
            `;
            if (todayPdfLinkEl) {
                todayPdfLinkEl.href = data.pdfLink || "#";
                todayPdfLinkEl.textContent = data.pdfLink ? "📄 Download Today's Notes" : "🚨 No notes available.";
            }
        } else {
            console.warn("🚨 No recording available today.");
        }
    } catch (error) {
        console.error("🚨 Firestore fetch error:", error.message);
    }
}

// ✅ Fetch & Embed Past 5 Days' Recordings
async function loadPastRecordings(userData) {
    const { className, teacherId } = userData;
    const recordingsRef = collection(db, "classes", className, "teachers", teacherId, "recordings");

    console.log("🔥 Fetching past recordings...");
    console.log(`🔥 Firestore Path: /classes/${className}/teachers/${teacherId}/recordings`);

    try {
        // ✅ Retrieve last 5 recordings in timestamp order
        const querySnap = await getDocs(query(recordingsRef, orderBy("timestamp", "desc"), limit(5)));
        console.log("✅ Firestore Query Results:", querySnap.docs.map(doc => doc.id));

        if (querySnap.empty) {
            console.warn("🚨 No past recordings found!");
            const recordingsListEl = document.getElementById("recordingsList");
            if (recordingsListEl) recordingsListEl.innerHTML = "🚨 No past recordings available.";
            return;
        }

        const recordingsListEl = document.getElementById("recordingsList");
        if (!recordingsListEl) {
            console.error("🚨 Error: `recordingsList` element not found in the DOM!");
            return;
        }

        recordingsListEl.innerHTML = "";
        querySnap.forEach((doc) => {
            const data = doc.data();
            console.log("🔥 Found Past Recording Data:", data);

            // ✅ Ensure timestamp format is valid
            const formattedDate = data.timestamp ? new Date(data.timestamp).toISOString().split('T')[0] : "Unknown Date";

            // ✅ Append correctly formatted data to HTML
            recordingsListEl.innerHTML += `
                <h3>📅 ${formattedDate}: ${data.title}</h3>
                <iframe width="560" height="315" src="${data.videoLink}" 
                title="${data.title}" frameborder="0" allowfullscreen></iframe>
                <p><strong>Notes:</strong> <a href="${data.pdfLink}" target="_blank">📄 Download Notes</a></p>
                <hr>
            `;
        });

    } catch (error) {
        console.error("🚨 Firestore fetch error:", error.message);
    }
}
// ✅ Authenticate User & Load Content
onAuthStateChanged(auth, async (user) => {
    console.log("🛠 Checking authentication status...");
    
    if (!user) {
        console.error("🚨 User is NOT authenticated! Redirecting to login...");
        window.location.href = "login.html"; // 🔥 Redirect if not logged in
        return;
    }

    console.log("✅ User authenticated:", user.email); // 🔥 Confirm user is logged in

    try {
        const userData = await getStudentData(user);
        if (!userData) {
            console.warn("🚨 No class found for this student:", user.email);
            document.getElementById("recordingsList").innerHTML = "🚨 No class found for this student!";
            return;
        }

        console.log("🔥 Retrieved student class:", userData.className);
        console.log("🔥 Loading today's session...");
        await loadTodaysSession(userData);
        
        console.log("🔥 Loading past recordings...");
        await loadPastRecordings(userData);
        
        console.log("✅ Class recordings loaded successfully!");
    } catch (error) {
        console.error("🚨 Unexpected error loading recordings:", error.message);
    }
});
async function testFirestoreAccess() {
    const recordingsRef = collection(db, "classes", "chemistry_form4", "teachers", "Bm0UsqPwbpPN3khlHZ9XYsYdsIx2", "recordings");

    try {
        const snapshot = await getDocs(recordingsRef);
        console.log("🔥 Firestore Test - Found Documents:", snapshot.docs.map(doc => doc.id));
    } catch (error) {
        console.error("🚨 Firestore Read Access Issue:", error.message);
    }
}

// ✅ Run test when page loads
async function testFetchRecording() {
    const className = "chemistry_form4"; // ✅ Adjust if needed
    const teacherId = "Bm0UsqPwbpPN3khlHZ9XYsYdsIx2"; // ✅ Ensure correct teacher ID
    const recordingId = "2025-05-08T23:52:10.795Z"; // 🔥 Provided timestamp document ID

    console.log("🔥 Attempting to fetch recording:", recordingId);

    // ✅ Fetch the specific document
    const recordingDocRef = doc(db, "classes", className, "teachers", teacherId, "recordings", recordingId);
    const recordingSnap = await getDoc(recordingDocRef);

    if (recordingSnap.exists()) {
        const data = recordingSnap.data();
        console.log("🔥 Successfully retrieved recording:", data);

        // ✅ Display in HTML file: class_recordings.html
        const todayTitleEl = document.getElementById("todayTitle");
        const todayContainerEl = document.getElementById("todayRecordingContainer");

        if (todayTitleEl) todayTitleEl.innerHTML = `<strong>${data.title}</strong>`;
        if (todayContainerEl) {
            const embedUrl = data.videoId ? `https://www.youtube.com/embed/${data.videoId}` : data.videoLink;
            todayContainerEl.innerHTML = `
                <iframe width="560" height="315" src="${embedUrl}" 
                title="${data.title}" frameborder="0" allowfullscreen></iframe>
            `;
        }
    } else {
        console.warn("🚨 Recording document not found!");
    }
}

// ✅ Run this test function
testFetchRecording();