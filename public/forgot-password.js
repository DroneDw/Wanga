import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

document.getElementById("resetButton").addEventListener("click", async function() {
    const email = document.getElementById("resetEmail").value.trim();
    const message = document.getElementById("message");

    if (!email) {
        message.innerHTML = "🚨 Please enter your email.";
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        message.innerHTML = "✅ Password reset email sent! Check your inbox.";
    } catch (error) {
        console.error("🚨 Error sending password reset email:", error);
        message.innerHTML = "🚨 Error: " + error.message;
    }
});