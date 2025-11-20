document.addEventListener("DOMContentLoaded", function() {
    if (typeof firebase === "undefined") {
        console.error("🚨 Firebase failed to load! Check admin.html script order.");
        return;
    }

    console.log("✅ Firebase detected, initializing...");
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    window.updateTopic = async function() {
        try {
            const subject = document.getElementById("subject").value;
            const topic = document.getElementById("topic").value;
            const notes = document.getElementById("notes").value;
            const pdfLink = document.getElementById("pdfLink").value || "";
            const meetLink = document.getElementById("meetLink").value || "";
    
            if (!subject || !topic || !notes) {
                document.getElementById("statusMessage").textContent = "⚠️ Please fill in all required fields!";
                return;
            }
    
            await db.collection("topics").doc(subject).set({
                date: new Date().toISOString().split("T")[0],
                topic,
                notes,
                pdfLink,
                meetLink
            }, { merge: true });
    
            document.getElementById("statusMessage").textContent = "✅ Topic updated successfully!";
            console.log(`✅ ${subject} topic and meeting link updated in Firestore!`);
        } catch (error) {
            console.error("🚨 Error updating Firestore:", error.message);
            document.getElementById("statusMessage").textContent = "❌ Failed to update topic.";
        }
    };
});