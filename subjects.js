import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();

// ✅ Store subject meeting links
async function storeSubjectLink(subject, link) {
    try {
        await setDoc(doc(db, "classes", subject), { link });
        console.log(`✅ ${subject} class link stored in Firestore: ${link}`);
    } catch (error) {
        console.error("❌ Error storing subject link:", error.message);
    }
}

// ✅ Retrieve subject meeting link
async function getSubjectLink(subject) {
    try {
        const docRef = doc(db, "classes", subject);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`✅ Join ${subject} class here:`, docSnap.data().link);
            return docSnap.data().link;
        } else {
            console.error("❌ No link found for", subject);
            return null;
        }
    } catch (error) {
        console.error("🚨 Error fetching subject link:", error.message);
    }
}

// ✅ Retrieve daily topic, notes, and PDF link for a subject
async function getDailyTopic(subject) {
    try {
        const docRef = doc(db, "topics", subject);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const topicData = docSnap.data();
            document.getElementById("dailyTopic").innerHTML = 
                `📌 <strong>Today's Topic:</strong> ${topicData.topic} <br>
                 📝 <strong>Notes:</strong> ${topicData.notes} <br>
                 📂 <strong>PDF:</strong> <a href="${topicData.pdfLink}" target="_blank">Download</a>`;
        } else {
            document.getElementById("dailyTopic").innerHTML = "No topic available.";
        }
    } catch (error) {
        console.error("🚨 Error fetching daily topic:", error.message);
    }
}

// 🚀 Automatically fetch subject data
const subjectName = window.location.pathname.replace(".html", "").substring(1); // Extracts "math" from "mathematics.html"
getSubjectLink(subjectName);
getDailyTopic(subjectName);

export { storeSubjectLink, getSubjectLink, getDailyTopic };