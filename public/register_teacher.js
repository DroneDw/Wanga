import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

// ✅ Fixed Default Password for Teachers & Verifiers
const defaultPassword = "WANGA@2002";  

// 🔥 Add event listener for role toggle
document.getElementById("toggleRole").addEventListener("click", () => {
    const formTitle = document.getElementById("formTitle");
    const subjectField = document.getElementById("teacherFields");
    
    if (formTitle.textContent.includes("Teacher")) {
        formTitle.textContent = "🛠 Verifier Registration";
        subjectField.style.display = "none";
    } else {
        formTitle.textContent = "📚 Teacher Registration";
        subjectField.style.display = "block";
    }
});

// ✅ Handle Registration for Teachers & Verifiers
document.getElementById("registerBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const isVerifier = document.getElementById("formTitle").textContent.includes("Verifier");
    const password = defaultPassword;

    let subject = null;
    let selectedClass = null;

    if (!email) {
        document.getElementById("statusMessage").textContent = "🚨 Email is required!";
        return;
    }

    if (!isVerifier) {
        subject = document.getElementById("teacherSubject").value.trim().toLowerCase();
        selectedClass = document.getElementById("teacherClass").value.trim();

        if (!subject || !selectedClass) {
            document.getElementById("statusMessage").textContent = "🚨 Please select a subject and class!";
            return;
        }

        // ✅ Check if a teacher already exists for this subject & class
        const teacherRef = doc(db, `classes/${selectedClass}/teachers/${subject}`);
        const teacherSnap = await getDoc(teacherRef);

        if (teacherSnap.exists()) {
            document.getElementById("statusMessage").textContent = `🚨 A teacher for ${subject} in ${selectedClass} is already registered!`;
            return;
        }
    }

    try {
        if (isVerifier) {
            // ✅ Count the number of verifiers
            const verifiersRef = collection(db, "users");
            const verifiersSnap = await getDocs(verifiersRef);
            const verifierCount = verifiersSnap.docs.filter(doc => doc.data().role === "verifier").length;

            if (verifierCount >= 10) {
                document.getElementById("statusMessage").textContent = "🚨 Maximum verifiers reached! No more registrations allowed.";
                return;
            }
        }

        // ✅ Proceed with authentication only if conditions are met
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await auth.currentUser.getIdToken(true); // 🔥 Ensure authentication is recognized

        // ✅ Store User Data in Firestore
        const userData = {
            email: email,
            role: isVerifier ? "verifier" : "teacher",
            createdAt: new Date(),
        };

        if (!isVerifier) {
            userData.subject = subject;
            userData.class = selectedClass;
        }

        await setDoc(doc(db, "users", user.uid), userData);

        if (!isVerifier) {
            await setDoc(doc(db, `classes/${selectedClass}/teachers/${subject}`), { teacherId: user.uid, teacherEmail: user.email });
        }

        document.getElementById("statusMessage").textContent = `✅ ${isVerifier ? "Verifier" : "Teacher"} registration successful! Redirecting...`;

        setTimeout(() => {
            window.location.href = isVerifier ? "verify_payment.html" : `${subject}_${selectedClass}_teacher.html`;
        }, 2000);

    } catch (error) {
        document.getElementById("statusMessage").textContent = "🚨 Registration failed!";
        console.error("🚨 Registration error:", error.message);
    }
});