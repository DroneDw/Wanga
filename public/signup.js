import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js"; // Import Firebase setup

document.getElementById("signupForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent form refresh

    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value.trim(); // ✅ Capture phone input
    const password = document.getElementById("password").value;
    const fullName = document.getElementById("name").value; // ✅ Capture name input
    const selectedClass = document.getElementById("classSelection").value; // ✅ Capture selected class
    const signupButton = document.querySelector("button[type='submit']"); // ✅ Select signup button

    if (!selectedClass || !fullName.trim() || !phone) {
        alert("🚨 Please fill in all required fields!");
        return;
    }

    // ✅ Validate phone number format (10 digits)
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone)) {
        alert("🚨 Invalid phone number! Enter a valid 10-digit number.");
        return;
    }

    try {
        signupButton.innerHTML = `<span class="spinner"></span> Signing up...`; // ✅ Show spinner text
        signupButton.disabled = true; // ✅ Disable button to prevent multiple clicks

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Set the display name in Firebase Authentication
        await updateProfile(user, { displayName: fullName });

        // ✅ Check if Firestore already has data for this user before writing
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        // ✅ Merge new data instead of overwriting existing fields
        await setDoc(userRef, {
            name: fullName, // 🔥 Ensure name is saved in Firestore
            email: email,
            phone: phone, // ✅ Store phone number
            class: selectedClass, // ✅ Save class selection
            subscriptionActive: false // Default subscription status
        }, { merge: true });

        // ✅ Restore button after successful signup
        signupButton.innerHTML = "Sign Up";
        signupButton.disabled = false;

        alert(`✅ Account created successfully, ${fullName}!`);
        window.location.href = "login.html"; // Redirect to login page
    } catch (error) {
        signupButton.innerHTML = "Sign Up"; // ✅ Restore button on error
        signupButton.disabled = false;
        alert("🚨 Error: " + error.message);
    }
});