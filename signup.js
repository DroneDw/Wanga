import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js"; // Import Firebase setup

document.getElementById("signupForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent form refresh

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const name = document.getElementById("name").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user details in Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            subscriptionActive: false // Default subscription status
        });

        alert("Account created successfully!");
        window.location.href = "login.html"; // Redirect to login page
    } catch (error) {
        alert("Error: " + error.message);
    }
});
