import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
    const courseForm = document.getElementById("courseForm");

    courseForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page refresh

        const saveButton = document.querySelector("button[type='submit']"); // ✅ Select save button
        saveButton.innerHTML = `<span class="spinner"></span> Saving...`; // ✅ Show spinner text
        saveButton.disabled = true; // ✅ Disable button to prevent multiple clicks

        const user = auth.currentUser; // Get logged-in user
        if (!user) {
            alert("Please log in to select courses.");
            saveButton.innerHTML = "Save & Continue"; // ✅ Restore button
            saveButton.disabled = false;
            window.location.href = "login.html"; // Redirect to login
            return;
        }

        const selectedCourses = {};
        document.querySelectorAll("input[type='checkbox']:checked").forEach((checkbox) => {
            selectedCourses[checkbox.value] = {
                subscriptionActive: false,
                verified: false,
                transactionId: null
            };
        });

        if (Object.keys(selectedCourses).length > 0) {
            try {
                // ✅ Store courses as an object (not an array)
                await updateDoc(doc(db, "users", user.uid), {
                    courses: selectedCourses
                });

                alert("Courses saved successfully! Redirecting to your dashboard...");
                window.location.href = "dashboard.html"; // Redirect after saving
            } catch (error) {
                console.error("🚨 Error saving courses:", error);
                alert("Failed to save courses. Please try again.");
            }
        } else {
            alert("Please select at least one course.");
        }

        // ✅ Restore button state after processing
        saveButton.innerHTML = "Save & Continue";
        saveButton.disabled = false;
    });
});