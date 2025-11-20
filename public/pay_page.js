import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc,query,where,collection,getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

// ✅ Ensure authentication is verified before fetching subjects
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        console.warn("🚨 No authenticated user detected—redirecting to login.");
        window.location.href = "login.html";
        return;
    }

    console.log("🔥 User authenticated—fetching unpaid subjects...");

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const courses = userData.courses || {};

            console.log("🔥 User Courses from Firestore:", courses);

            const subjectsListContainer = document.querySelector(".subjects-list");

            // ✅ Filter: Show only unpaid subjects
            const unpaidSubjects = Object.entries(courses).filter(([subject, data]) => {
                return !data.verified || !data.subscriptionActive; // ✅ Only show unpaid courses
            });

            if (unpaidSubjects.length === 0) {
                subjectsListContainer.innerHTML = `<p style="color: red;">✅ All your subjects are already paid for!</p>`;
                return;
            }

            // ✅ Generate dynamic checkboxes for unpaid subjects
            subjectsListContainer.innerHTML = unpaidSubjects.map(([subject]) => `
                <label>
                    <input type="checkbox" name="subjects" value="${subject}"> ${subject} - MWK 5000
                </label><br>
            `).join("");

            console.log("✅ Dynamic subjects rendered successfully.");
        } else {
            console.warn("🚨 User data not found in Firestore.");
        }
    } catch (error) {
        console.error("🚨 Error fetching user subjects:", error.message);
    }
});

// ✅ Handle Payment Submission
document.getElementById("paymentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const amount = parseInt(document.getElementById("amount").value.trim());
    const selectedSubjects = document.querySelectorAll('input[name="subjects"]:checked');

    const subjectPrice = 5000; // ✅ Set price per subject
    const totalSubjects = selectedSubjects.length;
    const expectedAmount = totalSubjects * subjectPrice;

    if (amount !== expectedAmount) {
        alert(`🚨 Payment mismatch! You selected ${totalSubjects} subjects but paid for MWK ${amount}. Please adjust.`);
        return; // ❌ Stop processing
    }

    const user = auth.currentUser;
    if (!user) {
        alert("🚨 You must be logged in to make a payment!");
        return;
    }

    // 🔥 Get form values
    const phone = document.getElementById("phone").value.trim();
    const transactionId = document.getElementById("transactionId").value.trim();

    if (selectedSubjects.length === 0 || !phone || !amount || !transactionId) {
        alert("🚨 All fields are required!");
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        let userData = userDoc.exists() ? userDoc.data() : { courses: {} };

        // // ✅ Ensure transaction ID exists (if verifier created it first)
        // const paymentRef = doc(db, "payments", transactionId);
        // const paymentSnap = await getDoc(paymentRef);

        // 🔥 Check Firestore to see if the transaction ID is already linked to another subject
        const paymentRef = doc(db, "payments", transactionId);
        console.log("🔎 Checking Firestore for transaction ID:", transactionId);
        
        const paymentSnap = await getDoc(paymentRef);
        
        if (paymentSnap.exists()) {
            console.log("✅ Transaction ID found in Firestore.");
        
            const paymentData = paymentSnap.data();
            console.log("📦 Found payment record:", paymentData);
        
            if (paymentData.verified === true) {
                const usedByUserId = paymentData.userId;
                const existingSubjects = paymentData.subjects || [];
        
                console.log("🚨 Transaction is already verified. Linked subjects:", existingSubjects);
                console.log("🔐 Checking if user is trying to add new subjects...");
        
                const selectedSubjectNames = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(subject => subject.value);
                const newSubjects = selectedSubjectNames.filter(sub => !existingSubjects.includes(sub));
        
                console.log("🧾 Selected subjects:", selectedSubjectNames);
                console.log("🔍 Existing subjects:", existingSubjects);
                console.log("🚫 New subjects not in original:", newSubjects);
        
                if (newSubjects.length > 0) {
                    console.log("❌ New subjects detected. Blocking reuse of transaction ID.");
        
                    const userRef = doc(db, "users", usedByUserId);
                    const userSnap = await getDoc(userRef);
                    const userName = userSnap.exists() ? userSnap.data().name : "Unknown User";
        
                    console.error(`🚨 Transaction ID already verified for other subjects. Attempted reuse by ${userName}`);
                    alert(`🚨 This transaction ID is already verified and linked to: ${existingSubjects.join(", ")}. You cannot use it for new subjects.`);
                    return;
                } else {
                    console.log("✅ No new subjects detected. Allowing continuation.");
                }
            } else {
                console.log("🟢 Transaction exists but is not verified. Proceeding with verification.");
            }
        } else {
            console.log("❌ No matching transaction ID found in Firestore. Proceeding to create new payment record.");
        }

        console.log("🔎 Checking transaction ID:", transactionId);

        if (paymentSnap.exists()) {
            console.log("✅ Transaction ID found—fetching verifier details.");
        
            const existingPaymentData = paymentSnap.data();
            console.log("🔥 Verifier's Recorded Payment Data:", existingPaymentData);
        
            // 🔥 Ensure subjects are added if verifier created the transaction first
            if (!existingPaymentData.subjects || existingPaymentData.subjects.length === 0) {
                console.log("🔥 Verifier started this transaction—attaching subjects now!");
                await updateDoc(paymentRef, { subjects: Array.from(selectedSubjects).map(subject => subject.value) });
            }
        
            // ✅ Ensure `userId` is attached if missing (verifier-started transaction)
            if (!existingPaymentData.userId) {
                console.log("🔥 Verifier initiated transaction—attaching userId now!");
                await updateDoc(paymentRef, { userId: user.uid });
            }
        
            // ✅ Ensure verifier has approved payment BEFORE updating user courses
            if (!existingPaymentData.verified) { 
                console.log("🚨 Payment verification still pending—allowing update if details match.");
            }
        
            // ✅ Ensure user details match existing verifier data before updating
            if (existingPaymentData.amount === amount && existingPaymentData.phone === phone) {
                console.log("✅ Matching details found—marking payment as verified!");
        
                await updateDoc(paymentRef, {
                    subjects: Array.from(selectedSubjects).map(subject => subject.value),
                    status: "verified", // ✅ Transitioning from "pending" to "verified"
                    verified: true, // ✅ Ensuring verification completes
                    timestamp: new Date().toISOString()
                });
        
                console.log("🔥 Payment Data After Update:", await getDoc(paymentRef).then((docSnap) => docSnap.data()));
        
                // ✅ Mark selected subjects as verified in the user record
                selectedSubjects.forEach(subject => {
                    const subjectName = subject.value;
                    userData.courses[subjectName] = {
                        subscriptionActive: true, // ✅ Activated!
                        verified: true, // ✅ Verified status!
                        status: "verified",
                        expirationDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
                        transactionId: transactionId,
                        phone: phone
                    };
                });
        
                await updateDoc(userRef, { courses: userData.courses });
        
                alert(`✅ Payment verified! Your subscription to ${selectedSubjects.length} subjects is now active.`);
                window.location.href = "dashboard.html"; // Redirect user back to their dashboard
            } else {
                console.error("🚨 User details do NOT match verifier entry—payment update denied!");
                alert("🚨 Payment details do not match verifier record. Please check transaction ID, amount, or phone.");
                return;
            }
        }else {
            console.log("🚨 Transaction ID not found—creating new payment record.");
            await setDoc(paymentRef, {
                userId: user.uid,
                phone: phone,
                amount: amount,
                subjects: Array.from(selectedSubjects).map(subject => subject.value),
                status: "pending_verification",
                verified: false,
                timestamp: new Date().toISOString()
            });
            selectedSubjects.forEach(subject => {
                const subjectName = subject.value;
                userData.courses[subjectName] = {
                    subscriptionActive: false, 
                    verified: false, 
                    status: "pending_verification", // ✅ Change to "Pending" immediately
                    transactionId: transactionId,
                    phone: phone
                };
            });
            
            // ✅ Ensure the user's course data reflects "Pending Verification"
            await updateDoc(userRef, { courses: userData.courses });

            console.log("✅ New payment record created with transaction ID:", transactionId);
            alert(`✅ Payment verified! Your subscription to ${selectedSubjects.length} subjects is now active.`);
            window.location.href = "dashboard.html"; // Redirect user back to their dashboard
        }

    } catch (error) {
        console.error("🚨 Error processing payment:", error);
        alert("🚨 Payment submission failed. Please try again.");
    }
});