import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, getDoc, setDoc, collection, addDoc, query, orderBy, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "../firebase-config.js";

const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const replyIndicator = document.createElement("div"); // ✅ Reply indicator
let replyingTo = null;
let replyingToName = null; // ✅ Define this globally

replyIndicator.id = "replyIndicator";
replyIndicator.classList.add("hidden");
document.querySelector(".chat-container").insertBefore(replyIndicator, messageForm);

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    console.log("User UID:", auth.currentUser?.uid);

    const messagesRef = collection(db, "physics_chat_form1");
    const userMessagesRef = doc(db, "message_limits", user.uid);
    const today = new Date().toISOString().split("T")[0];
    
    // ✅ Fetch user's daily question count
    const messageLimitSnap = await getDoc(userMessagesRef);
    const messageLimitData = messageLimitSnap.exists() ? messageLimitSnap.data() : { date: today, count: 0 };
    
    // ✅ Ensure the document exists before updating
    if (!messageLimitSnap.exists()) {
        await setDoc(userMessagesRef, { date: today, count: 0 }); // ✅ Create document if missing
    }

    if (messageLimitData.date !== today) {
        await updateDoc(userMessagesRef, { date: today, count: 0 }); // ✅ Now safe to update
    }
    
    if (messageLimitData.date !== today) {
        await updateDoc(userMessagesRef, { date: today, count: 0 });
    }
    
    // ✅ Real-time updates & only show last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    onSnapshot(query(messagesRef, where("timestamp", ">", sevenDaysAgo), orderBy("timestamp", "asc")), (snapshot) => {
        const lastScrollPosition = localStorage.getItem("chatScrollPosition"); // ✅ Get last saved scroll position
    
        messagesContainer.innerHTML = "";
    
        snapshot.forEach(async (docSnapshot) => {
            const messageData = docSnapshot.data();
            const messageTime = new Date(messageData.timestamp.toMillis()).toLocaleTimeString();
    
            const messageElement = document.createElement("div");
            messageElement.classList.add("message-item");
    
            const isUserMessage = messageData.name === user.displayName;
            messageElement.classList.add(isUserMessage ? "user-message" : "other-message");
    
            // ✅ Highlight unread messages
            if (!messageData.readBy || !messageData.readBy.includes(user.uid)) {
                messageElement.classList.add("unread-message");
            }
    
            // ✅ Teacher messages have a unique color
            if (messageData.role === "teacher") {
                messageElement.classList.add("teacher-message");
            }
    
            // ✅ Display "Replying to" if message is a reply
            if (messageData.repliedTo) {
                const replyInfo = document.createElement("div");
                replyInfo.classList.add("reply-info");
                replyInfo.innerText = `${messageData.repliedToName}: "${messageData.repliedTo}"`;
                messageElement.appendChild(replyInfo);
            }
    
            if (!isUserMessage) { // ✅ Show sender name only for others
                messageElement.innerHTML += `<strong>${messageData.name}:</strong> ${messageData.text} <span class="message-time">${messageTime}</span>`;
            } else {
                messageElement.innerHTML += `${messageData.text} <span class="message-time">${messageTime}</span>`; // ✅ Remove sender name for yourself
            }
    
            // ✅ Reply button
            const replyButton = document.createElement("button");
            replyButton.innerText = "Reply";
            replyButton.classList.add("reply-button");
            replyButton.addEventListener("click", () => startReply(messageData));
    
            messageElement.appendChild(replyButton);
            messagesContainer.appendChild(messageElement);
    
            // ✅ Mark messages as read when displayed
            if (!messageData.readBy || !messageData.readBy.includes(user.uid)) {
                await updateDoc(doc(db, "physics_chat_form1", docSnapshot.id), {
                    readBy: [...(messageData.readBy || []), user.uid]
                });
            }
        });
    
        // ✅ Restore the last scroll position
        if (lastScrollPosition) {
            messagesContainer.scrollTop = lastScrollPosition;
        }
    });
    
    // ✅ Save scroll position before leaving the page
    window.addEventListener("beforeunload", () => {
        localStorage.setItem("chatScrollPosition", messagesContainer.scrollTop);
    });
    
    // ✅ Handle replies using the same input field
    function startReply(messageData) {
        replyingTo = messageData.text;
        replyingToName = messageData.name; // ✅ Store the original sender’s name
        replyIndicator.innerText = `${replyingToName}: "${replyingTo}"`; // ✅ Show correct sender
        replyIndicator.classList.remove("hidden");
        messageInput.placeholder = `Replying to ${replyingToName}...`;
    }
    
    // ✅ Cancel Reply Function
    // ✅ Cancel Reply Function (Now fully resets everything)
    document.getElementById("cancelReply").addEventListener("click", () => {
        replyingTo = null;
        replyIndicator.innerText = ""; // ✅ Clears reply text completely
        replyIndicator.classList.add("hidden"); // ✅ Hides the indicator
        messageInput.placeholder = "Type your physics question...";
    });
    
    // ✅ Send message with limit tracking
    messageForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!messageInput.value.trim()) return;
    
        // ✅ Check message limit (Teachers have unlimited messages)
        const updatedSnap = await getDoc(userMessagesRef);
        const updatedData = updatedSnap.exists() ? updatedSnap.data() : { date: today, count: 0 };
    
        if (updatedData.date !== today) {
            await updateDoc(userMessagesRef, { date: today, count: 0 }); // ✅ Reset daily count for a new day
        }
    
        // ✅ Apply message limit only to students
        if (updatedData.count >= 10 && user.role !== "teacher") {
            alert("🚨 You have reached your daily limit of 3 questions.");
            return;
        }
    
        await addDoc(messagesRef, {
            name: user.displayName || "Anonymous",
            text: messageInput.value.trim(),
            timestamp: serverTimestamp(),
            readBy: [user.uid], // ✅ Mark message as read for sender
            role: user.role || "student", // ✅ Track teacher vs student messages
            repliedTo: replyingTo || null, // ✅ Attach reply reference if applicable
            repliedToName: replyingToName || null // ✅ Ensure sender’s name is stored
        });
    
        // ✅ Clear input field after sending
        messageInput.value = "";
        messageInput.placeholder = "Type your physics question...";
        
        // ✅ Hide reply indicator
        replyingTo = null;
        replyIndicator.innerText = ""; 
        replyIndicator.classList.add("hidden");
    
        // ✅ Only update message count for students
        if (user.role !== "teacher") {
            await updateDoc(userMessagesRef, { date: today, count: updatedData.count + 1 });
        }
    });
});