import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html"; // Redirect if not logged in
        return;
    }

    const userRef = doc(db, "users", user.uid);

    // ✅ Firestore Real-Time Subscription Monitoring
    onSnapshot(userRef, (userDoc) => {
        if (!userDoc.exists()) {
            console.error("🚨 User document not found in Firestore!");
            return;
        }

        const userData = userDoc.data();
        console.log("🔥 Firestore Real-Time Data:", userData);

        // ✅ Ensure `courses` field is correctly retrieved
        if (!userData.courses || typeof userData.courses !== "object") {
            console.error("🚨 No courses found in Firestore! Adding empty structure...");
            setDoc(userRef, { courses: {} }, { merge: true });
            userData.courses = {};
        }

        // ✅ Ensure username is updated correctly
        const userNameDisplay = document.getElementById("userName"); 
        userNameDisplay.textContent = userData.name || user.displayName || "Guest";

        console.log("🔥 Processing Courses for Display:", userData.courses);
        updateCourseListDisplay(userData.courses, userData.form || "form1", userData);

        // ✅ Ensure checkboxes reflect stored courses correctly
        document.querySelectorAll('input[name="courses"]').forEach(checkbox => {
            checkbox.checked = userData.courses[checkbox.value] ? true : false;
        });

        // ✅ Update Subscription Status
        updateSubscriptionStatus(userData.courses);
    });
});

// ✅ Function to Calculate Remaining Subscription Days
function calculateRemainingDays(endDate) {
    if (!endDate) return "Expired"; // ✅ Prevent `NaN` errors

    const today = new Date();
    const expirationDate = new Date(endDate);
    const timeDiff = expirationDate - today;
    return timeDiff <= 0 ? "Expired" : Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

// ✅ Function to Display Subscription Status
function updateSubscriptionStatus(courses) {
    const subscriptionStatusElem = document.getElementById("subscriptionStatus");
    subscriptionStatusElem.innerHTML = "";

    if (!courses || Object.keys(courses).length === 0) {
        subscriptionStatusElem.innerHTML = "<li style='color: red;'>No active subscriptions.</li>";
        return;
    }

    Object.entries(courses).forEach(([courseName, courseData]) => {
        if (courseData.subscriptionActive && courseData.verified) {
            const remainingDays = calculateRemainingDays(courseData.expirationDate);
            const statusColor = remainingDays === "Expired" ? "red" : "green";
            subscriptionStatusElem.innerHTML += `<li style='color: ${statusColor};'>
                ${courseName}: <strong>${remainingDays} days left</strong>
            </li>`;
        }
    });
}

// ✅ Function to update Firestore and retain checked courses
async function updateUserCourses(userId) {
    const userRef = doc(db, "users", userId);

    try {
        const userSnap = await getDoc(userRef);
        const currentUserData = userSnap.exists() ? userSnap.data() : {};

        console.log("🔥 Firestore Data BEFORE Update:", currentUserData);

        const currentCourses = currentUserData.courses || {};
        const selectedCourses = {};
        const uncheckedCourses = [];

        document.querySelectorAll('input[name="courses"]').forEach(checkbox => {
            const courseName = checkbox.value;
            const existingCourse = currentCourses[courseName];

            if (checkbox.checked) {
                selectedCourses[courseName] = {
                    subscriptionActive: existingCourse?.subscriptionActive || false, 
                    verified: existingCourse?.verified || false, 
                    transactionId: existingCourse?.transactionId || null,
                    status: existingCourse?.status || (existingCourse?.verified ? "paid" : "not_paid"),
                    expirationDate: existingCourse?.expirationDate || null
                };
            } else if (!existingCourse?.verified && !existingCourse?.subscriptionActive) {
                uncheckedCourses.push(courseName);
                console.log(`🚨 Marking ${courseName} for deletion.`);
            } else {
                selectedCourses[courseName] = existingCourse;
            }
        });

        console.log("🔥 Fix: Preventing removal of paid courses!");

        await setDoc(userRef, { 
            courses: selectedCourses,
            class: currentUserData.class || "Not Assigned" 
        }, { merge: true });

        console.log("✅ Firestore Update Completed—Paid courses remain intact!");

        // ✅ Ensure Firestore permanently removes unchecked unpaid courses
        for (let course of uncheckedCourses) {
            await setDoc(userRef, { [`courses.${course}`]: deleteField() }, { merge: true });
            console.log(`🚨 Removed ${course} from Firestore!`);
        }

        // ✅ Retrieve latest Firestore data **AFTER deletions**
        const updatedSnap = await getDoc(userRef);
        const updatedUserData = updatedSnap.exists() ? updatedSnap.data() : {};

        console.log("🔥 Firestore Data AFTER Update:", updatedUserData);

        // ✅ Force UI Update After Course Removal
        console.log("🚀 Refreshing UI to reflect removed subjects!");
        updateCourseListDisplay(updatedUserData.courses, updatedUserData.form || "form1", updatedUserData);

        alert("✅ Courses updated successfully!");
    } catch (error) {
        console.error("🚨 Error updating courses:", error);
    }
}

// ✅ Function to render the course list dynamically with verification checks
function updateCourseListDisplay(courses, studentForm, userData) {
    const courseList = document.getElementById("courseList");

    if (!courses || typeof courses !== "object") {
        console.error("🚨 Invalid courses data format!", courses);
        return;
    }

    console.log("🔥 Processing Courses for Display:", courses);

    // ✅ Ensure the correct form level is extracted
    const formLevel = userData.class;
    console.log(`✅ Correct Form Level Retrieved: ${formLevel}`);

    courseList.innerHTML = Object.entries(courses).map(([courseName, courseData]) => {
        console.log(`🔥 Displaying Course: ${courseName}`, courseData);

        const lowerCourse = courseName.toLowerCase();
        const targetPage = `${lowerCourse}_${formLevel}.html`;

        let statusLabel = " (Not Paid)";
        let linkColor = "#D9534F"; // 🔴 Soft Red (default for unpaid)

        // ✅ Color Logic Based on Status
        if (courseData.status === "pending_verification" && !courseData.verified) {
            statusLabel = " (Pending Verification)";
            linkColor = "#5BC0DE"; // 🔵 Soft Blue
        } else if (courseData.verified && courseData.subscriptionActive) {
            statusLabel = " (Paid)";
            linkColor = "#F8F9FA"; // ⚪ Off-White
        }

        return `<li>
            <a href="${courseData.status === "not_paid" ? "pay_page.html" : targetPage}" class="course-link"
                data-status="${courseData.status}"
                data-verified="${courseData.verified}"
                data-subscription="${courseData.subscriptionActive}"
                data-expiry="${userData.subscriptionExpiry}" 
                style="color: ${linkColor};">
                ${courseName}${statusLabel}
            </a>
        </li>`;
    }).join("");

    document.querySelectorAll(".course-link").forEach(link => {
        link.addEventListener("click", async function(event) {
            event.preventDefault();
    
            console.log("🔍 Course link clicked:", this.textContent);
    
            const courseStatus = this.getAttribute("data-status");
            const verified = this.getAttribute("data-verified") === "true";
            const subscriptionActive = this.getAttribute("data-subscription") === "true";
            const courseName = this.textContent.split("(")[0].trim();
            const today = new Date();
    
            console.log(`📘 Course: ${courseName}`);
            console.log(`📌 Status: ${courseStatus}, Verified: ${verified}, Active: ${subscriptionActive}`);
    
            // 🔥 Fetch the user's course data from Firestore to get the timestamp
            const user = auth.currentUser;
            if (!user) {
                console.error("❌ No authenticated user found.");
                alert("You must be logged in to access this course.");
                return;
            }
    
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
    
            if (!userSnap.exists()) {
                console.error("❌ User data not found in Firestore.");
                alert("User data not found.");
                return;
            }
    
            const userData = userSnap.data();
            const subjectData = userData.courses?.[courseName];
    
            if (!subjectData || !subjectData.transactionId) {
                console.warn(`⚠️ No transaction data found for ${courseName}.`);
                window.location.href = "pay_page.html";
                return;
            }
    
            // 🔍 Get payment timestamp from the payments collection
            const paymentRef = doc(db, "payments", subjectData.transactionId);
            const paymentSnap = await getDoc(paymentRef);
    
            if (!paymentSnap.exists()) {
                console.warn(`⚠️ Payment record not found for transaction ID: ${subjectData.transactionId}`);
                window.location.href = "pay_page.html";
                return;
            }
    
            const paymentData = paymentSnap.data();
            const paymentTimestamp = new Date(paymentData.timestamp);
            const expirationDate = new Date(paymentTimestamp);
            expirationDate.setDate(expirationDate.getDate() + 30);
    
            console.log(`📅 Payment Date: ${paymentTimestamp}`);
            console.log(`📅 Expiration Date: ${expirationDate}`);
            console.log(`📅 Today: ${today}`);
    
            // 🔒 Check if expired or invalid
            if (today > expirationDate || courseStatus === "pending" || !verified || !subscriptionActive) {
                console.warn(`🚨 Access denied for ${courseName}, subscription expired or not verified.`);
    
                const updateData = {};
                updateData[`courses.${courseName}.status`] = "not_paid";
                updateData[`courses.${courseName}.verified`] = false;
                updateData[`courses.${courseName}.subscriptionActive`] = false;
    
                await updateDoc(userRef, updateData);
                console.log(`✅ Firestore updated: ${courseName} marked as not_paid.`);
    
                console.log("➡️ Redirecting to payment page...");
                window.location.href = "pay_page.html";
            } else {
                console.log("✅ Access granted. Redirecting to course page...");
                window.location.href = this.href;
            }
        });
    });
}

// ✅ Event Listener for Updating Courses
document.getElementById("editCoursesForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;
    if (user) {
        await updateUserCourses(user.uid);
    }
});

onAuthStateChanged(auth, async (user) => { 
    if (!user) {
        window.location.href = "login.html"; // Redirect if user isn't logged in
        return;
    }

    console.log("🔥 User Auth Data:", user);

    const userRef = doc(db, "users", user.uid);

    // ✅ Force Firestore to retrieve latest data BEFORE UI updates
    const updatedSnap = await getDoc(userRef);
    const updatedUserData = updatedSnap.exists() ? updatedSnap.data() : {};

    console.log("🔥 Firestore Data AFTER Forced Refresh:", updatedUserData);

    onSnapshot(userRef, (userDoc) => {
        if (!userDoc.exists()) {
            console.error("🚨 User document not found in Firestore!");
            return;
        }

        console.log("🔥 Firestore Real-Time Data:", userDoc.data());

        // ✅ Fix: Get form level from Firebase Auth metadata (signup data)
        const formLevel = updatedUserData.class || updatedUserData.form || user.displayName || "Not Assigned"; 
        console.log(`✅ Logged In User's Form Level: ${formLevel}`);

        // ✅ Fix: Ensure deleted courses stay removed after refresh
        if (!updatedUserData.courses || Object.keys(updatedUserData.courses).length === 0) {
            console.warn("🚨 No courses found after refresh—ensuring UI reflects the removal!");
            document.getElementById("courseList").innerHTML = "<li style='color: red;'>No active courses.</li>";
            return;
        }

        console.log("🔥 Processing Courses for Display:", updatedUserData.courses);
        updateCourseListDisplay(updatedUserData.courses, formLevel, updatedUserData);
    });
});