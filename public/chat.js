import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const messagesRef = collection(db, "classroom_chat");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ✅ Real-time updates & only show last 7 days
    onSnapshot(query(messagesRef, where("timestamp", ">", sevenDaysAgo), orderBy("timestamp", "asc")), (snapshot) => {
        messagesContainer.innerHTML = "";
        let lastDate = "";

        snapshot.forEach((doc) => {
            const messageData = doc.data();
            const messageTime = new Date(messageData.timestamp.toMillis()).toLocaleTimeString();
        
            const messageElement = document.createElement("div");
            messageElement.classList.add("message-item"); // ✅ Apply the message styling
        
            // ✅ Distinguish between user and other messages
            const isUserMessage = messageData.name === user.displayName;
            messageElement.classList.add(isUserMessage ? "user-message" : "other-message");
        
            messageElement.innerHTML = `<strong>${messageData.name}:</strong> ${messageData.text} <span class="message-time">${messageTime}</span>`;
            
            messagesContainer.appendChild(messageElement);
        });
    });

    // ✅ Send a message with Firebase Server Timestamp
    messageForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!messageInput.value.trim()) return;

        await addDoc(messagesRef, {
            name: user.displayName || "Anonymous",
            text: messageInput.value.trim(),
            timestamp: serverTimestamp() // ✅ Ensures accurate timestamp from Firebase
        });

        messageInput.value = "";
    });
});