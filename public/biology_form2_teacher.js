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

// ✅ Function to Retrieve Teacher's Assigned Class from Firestore
async function getTeacherClass(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data().class; // 🔥 Automatically fetch assigned class
    } else {
        console.warn("🚨 No class assigned to this teacher!");
        return null;
    }
}

// ✅ Handle Topic, Notes, PDF & Meeting Link Submission
document.getElementById("uploadBtn").addEventListener("click", async () => {
    const topicTitle = document.getElementById("topicTitle").value.trim();
    const topicNotes = document.getElementById("topicNotes").value.trim();
    const pdfLink = document.getElementById("pdfLink").value.trim();
    const meetLink = document.getElementById("meetLink").value.trim();

    if (!topicTitle || !topicNotes || !pdfLink || !meetLink) {
        document.getElementById("statusMessage").textContent = "🚨 Please fill all fields!";
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const teacherClass = await getTeacherClass(user); // 🔥 Retrieve teacher's assigned class from Firestore
            if (!teacherClass) {
                document.getElementById("statusMessage").textContent = "🚨 No class found for this teacher!";
                return;
            }

            const subjectCollection = `biology_${teacherClass}`; // 🔥 Assign correct collection

            try {
                await setDoc(doc(db, "classes", subjectCollection, "teachers", user.uid), { // ✅ FIXED PATH
                    topic: topicTitle,
                    notes: topicNotes,
                    pdfLink: pdfLink,
                    meetLink: meetLink,
                    updatedBy: user.email,
                    updatedAt: new Date()
                });

                document.getElementById("statusMessage").textContent = "✅ Topic Saved!";
                console.log("✅ Stored under:", `classes/${subjectCollection}/teachers/${user.uid}`);
            } catch (error) {
                document.getElementById("statusMessage").textContent = "🚨 Save failed!";
                console.error("🚨 Firestore error:", error.message);
            }
        } else {
            document.getElementById("statusMessage").textContent = "🚨 User not authenticated!";
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

    const teacherClass = await getTeacherClass(user); // 🔥 Retrieve teacher's assigned class
    if (!teacherClass) {
        document.getElementById("statusMessage").textContent = "🚨 No class found for this teacher!";
        return;
    }

    const subjectCollection = `biology_${teacherClass}`; // 🔥 Assign correct collection

    try {
        const docRef = doc(db, "classes", subjectCollection, "teachers", user.uid); // ✅ FIXED PATH
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

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