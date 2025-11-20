import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

async function addQuizQuestion() {
    try {
        await addDoc(collection(db, "quizzes"), {
            question: "What is the chemical symbol for water?",
            options: ["H2O", "O2", "CO2", "NaCl"],
            correct: "H2O",
            timestamp: serverTimestamp()
        });
        console.log("✅ Question added successfully!");
    } catch (error) {
        console.error("🚨 Error adding question:", error);
    }
}