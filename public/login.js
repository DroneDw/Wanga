import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginButton = document.querySelector("button[type='submit']"); // ✅ Select login button

    try {
        loginButton.innerHTML = `<span class="spinner"></span> Logging in...`; // ✅ Show spinner text
        loginButton.disabled = true; // ✅ Disable button to prevent multiple clicks

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Ensure Firestore user record exists
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            console.log("🚀 User document missing! Recreating it now...");
            await setDoc(userRef, {
                name: user.displayName || "Unknown User",
                email: user.email,
                class: "form1",
                subscriptionActive: false,
                courses: {}
            });
            console.log("✅ User document restored in Firestore!");
        }

        // ✅ Enforce One Active Session at a Time
        const sessionRef = doc(db, "user_sessions", user.uid);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists() && sessionSnap.data().active) {
            console.warn("🚨 Another session is active. Logging out previous device...");
            
            // ✅ Log out previous session
            await setDoc(sessionRef, { active: false }, { merge: true });
            await signOut(auth);

            // ✅ Log in again immediately instead of redirecting
            console.log("✅ Previous session logged out. Proceeding with new login...");
            const newCredential = await signInWithEmailAndPassword(auth, email, password);

            // ✅ Store the new session as active
            await setDoc(sessionRef, {
                device: navigator.userAgent,
                lastLogin: new Date().toISOString(),
                active: true
            }, { merge: true });

            console.log("✅ Firestore Updated—New session is now active!");
        } else {
            // ✅ Store the current session as active if no prior session was found
            await setDoc(sessionRef, {
                device: navigator.userAgent,
                lastLogin: new Date().toISOString(),
                active: true
            }, { merge: true });

            console.log("✅ Firestore Updated—New session is now active!");
        }

        // ✅ Restore button after successful login
        loginButton.innerHTML = "Login";
        loginButton.disabled = false;

        // ✅ Redirect user based on course selection
        const courses = userDoc.exists() ? userDoc.data().courses : {};
        window.location.href = courses && Object.keys(courses).length > 0 ? "dashboard.html" : "course-selection.html";

    } catch (error) {
        loginButton.innerHTML = "Login"; // ✅ Restore button on error
        loginButton.disabled = false;
        alert("🚨 Error: " + error.message);
    }
});

// ✅ Auto Logout Previous Session on Page Close
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const sessionRef = doc(db, "user_sessions", user.uid);
    await setDoc(sessionRef, { active: true }, { merge: true });

    window.addEventListener("beforeunload", async () => {
        console.log("🚀 Logging out session on page close...");
        await setDoc(sessionRef, { active: false }, { merge: true });
    });
});