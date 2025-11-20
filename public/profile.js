import { getAuth, onAuthStateChanged, updateEmail } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html"; // Redirect if not logged in
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error("🚨 User data not found!");
        return;
    }

    const userData = userSnap.data();

    document.getElementById("name").value = userData.name || "";
    document.getElementById("email").value = userData.email || ""; // ✅ Email now editable
    document.getElementById("phone").value = userData.phone || "";
    document.getElementById("class").value = userData.class || "form1";

    const subjectsList = document.getElementById("subjectsList");
    subjectsList.innerHTML = Object.keys(userData.courses || {}).map(subject => 
        `<li>${subject} <button class="remove-btn" onclick="removeSubject('${subject}')">Remove</button></li>`
    ).join("");

    // ✅ Handle email update separately  
    document.getElementById("updateEmailBtn").addEventListener("click", async () => {
        const newEmail = document.getElementById("email").value.trim();

        if (!newEmail.includes("@")) {
            alert("🚨 Please enter a valid email address.");
            return;
        }

        try {
            await updateEmail(auth.currentUser, newEmail); // ✅ Update Firebase Auth email
            await updateDoc(userRef, { email: newEmail }); // ✅ Update Firestore email too
            alert("✅ Email updated successfully!");
        } catch (error) {
            alert(`🚨 Error updating email: ${error.message}`);
        }
    });

    // ✅ Handle profile form submission for class & phone updates  
    document.getElementById("profileForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const lastClassChange = userData.lastClassChange || Timestamp.fromDate(new Date("2000-01-01"));
        const currentDate = Timestamp.now();
        const oneMonthAgo = Timestamp.fromMillis(currentDate.toMillis() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

        const updatedClass = document.getElementById("class").value;
        const updatedPhone = document.getElementById("phone").value;

        if (updatedClass !== userData.class && lastClassChange.toMillis() > oneMonthAgo.toMillis()) {
            alert("🚨 You can only change class once per month.");
            return;
        }

        const updatedData = { phone: updatedPhone };

        if (updatedClass !== userData.class) {
            updatedData.class = updatedClass;
            updatedData.lastClassChange = Timestamp.now();
        }

        await updateDoc(userRef, updatedData);
        alert("✅ Profile updated successfully!");
    });

    // ✅ Function to Remove a Subject
    window.removeSubject = async function(subject) {
        const updatedCourses = { ...userData.courses };
        delete updatedCourses[subject];

        await updateDoc(userRef, { courses: updatedCourses });

        alert(`✅ Successfully removed ${subject}`);
        window.location.reload();
    };
});