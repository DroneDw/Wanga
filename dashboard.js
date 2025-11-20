import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html"; // Redirect if not logged in
        return;
    }

    document.getElementById("userName").textContent = user.displayName || "User";

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            
            document.getElementById("subscriptionStatus").textContent = 
                data.subscriptionActive ? "Active ✅" : "Expired ❌";

            const courseList = document.getElementById("courseList");
            courseList.innerHTML = data.courses.map(course => `<li>${course}</li>`).join("");

            // Placeholder for upcoming meetings (can be expanded later)
            document.getElementById("meetingList").innerHTML = "<li>Coming soon...</li>";
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
});
