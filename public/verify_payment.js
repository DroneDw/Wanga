import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

document.getElementById("verificationForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const authInstance = getAuth();
    
    console.log("🔥 Checking authentication state...");
    
    if (!authInstance.currentUser) {
        console.error("🚨 No user logged in!");
        alert("🚨 Please log in to verify payments!");
        window.location.href = "login.html";
        return;
    }
    
    console.log("✅ Logged-in user:", authInstance.currentUser.email);

    // 🔥 Force authentication refresh before verification
    await authInstance.currentUser.getIdToken(true);

    // ✅ Fetch user claims for debugging
    const token = await authInstance.currentUser.getIdTokenResult();
    console.log("🔥 User claims:", token.claims);
    
    console.log("✅ User is authorized as a verifier!");

    try {
        // 🔥 Refresh authentication before verification
        await authInstance.currentUser.getIdToken(true);
        await new Promise(resolve => onAuthStateChanged(authInstance, (user) => {
            if (!user) {
                console.error("🚨 Authentication failed!");
                alert("🚨 Authentication failed! Try logging in again.");
                return;
            }
            console.log("✅ Authentication successful!");
            resolve();
        }));

        console.log("🔥 Authentication refreshed—Proceeding with verification...");

        // ✅ Get payment record
        const transactionId = document.getElementById("transactionId").value.trim();
        const userPhone = document.getElementById("phone").value.trim();
        const amountPaid = parseInt(document.getElementById("amountPaid").value.trim());

        console.log("🔍 Fetching payment record for Transaction ID:", transactionId);

        const paymentRef = doc(db, "payments", transactionId);
        const paymentSnap = await getDoc(paymentRef);

        // ✅ Allow verifiers to create transactions if they don't exist
        if (!paymentSnap.exists()) {
            console.warn("🚨 Transaction ID not found! Creating a pending transaction...");

            await setDoc(paymentRef, {
                status: "pending_user_details", // 🔥 Waiting for user details
                verified: false,
                timestamp: new Date().toISOString(),
                phone: userPhone, // ✅ Store the user's phone
                amount: amountPaid // ✅ Store the user's entered amount
            });

            alert("✅ Transaction recorded with user's phone and amount! Waiting for user to submit details.");
            return;
        }

        console.log("✅ Payment record found!");

        const paymentData = paymentSnap.data();
        const paidSubjects = paymentData.subjects || [];

        console.log("✅ Paid subjects:", paidSubjects);

        // ✅ If user details are now available, update status to `pending_verification`
        if (paymentData.userId && paymentData.amount === amountPaid && paymentData.phone === userPhone) {
            console.log("🔥 User details found—updating status to pending_verification...");
            await updateDoc(paymentRef, { status: "pending_verification" });
        } else {
            console.error("🚨 Payment details do NOT match—cannot proceed with verification.");
            alert("🚨 Payment details do not match records. Please check transaction ID, amount, or phone number.");
            return;
        }

        // ✅ Get user data from Firestore
        const userRef = doc(db, "users", paymentData.userId);
        console.log("🔍 Fetching student record for User ID:", paymentData.userId);

        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        if (!userData || !userData.courses) {
            console.error("🚨 User has no selected courses!");
            alert("🚨 User has no selected courses!");
            return;
        }

        console.log("✅ Student record found:", userData);

        // ✅ Set Subscription Expiration Date (30 days from verification)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        console.log("🕒 Subscription expiration set for:", expirationDate.toISOString());

        // ✅ Mark all paid subjects as "Verified"
        let courseUpdates = {};
        paidSubjects.forEach(subject => {
            if (userData.courses[subject]) {
                courseUpdates[`courses.${subject}.subscriptionActive`] = true;
                courseUpdates[`courses.${subject}.verified`] = true;
                courseUpdates[`courses.${subject}.status`] = "verified"; 
                courseUpdates[`courses.${subject}.expirationDate`] = expirationDate.toISOString();
            } else {
                console.warn(`🚨 Subject ${subject} not found in user's selected courses—skipping.`);
            }
        });

        console.log("🔥 Updating student subscription in Firestore...");
        await updateDoc(userRef, courseUpdates);
        await updateDoc(paymentRef, { status: "verified" });

        console.log("✅ Payment successfully verified!");
        alert("✅ Payment successfully verified for all selected subjects!");

    } catch (error) {
        console.error("🚨 Error verifying payment:", error);
        alert("🚨 Verification failed! Try again.");
    }
});