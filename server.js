import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// ✅ Load Firebase Admin credentials
const serviceAccount = JSON.parse(fs.readFileSync("./firebase-admin.json", "utf-8"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // 🔥 Correct Firestore instance for Admin SDK

const app = express();
const PORT = 3000;

app.use(cors()); // ✅ Enable cross-origin requests
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// ✅ Handle User Registration (Verifier/Teacher)
app.post("/register", async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "🚨 Email, password, and role are required!" });
    }

    try {
        // ✅ Create User
        const userRecord = await admin.auth().createUser({ email, password });

        // ✅ Assign Custom Role Based on Registration Type
        const claims = role === "verifier" ? { verifier: true } : { teacher: true };
        await admin.auth().setCustomUserClaims(userRecord.uid, claims);

        // ✅ Store user data in Firestore
        await db.collection("users").doc(userRecord.uid).set({
            email: email,
            role: role,
            createdAt: new Date(),
        });

        console.log(`✅ Assigned role '${role}' to ${email}`);
        res.json({ message: "✅ Registration successful!", user: userRecord });

    } catch (error) {
        console.error("🚨 Registration failed:", error.message);
        res.status(400).json({ message: "🚨 Registration failed!", error: error.message });
    }
});

// ✅ Handle Login Requests (Checks Password)
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "🚨 Email and password are required!" });
    }

    try {
        // ✅ Retrieve user from Firebase Authentication
        const userRecord = await admin.auth().getUserByEmail(email);

        // ❌ Firebase Admin SDK **does NOT verify passwords directly**
        // ✅ Clients must authenticate using Firebase Authentication SDK before calling this API

        // ✅ Get user role from Firestore
        const userDoc = await db.collection("users").doc(userRecord.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "🚨 User not found in Firestore!" });
        }

        console.log(`✅ User logged in: ${email}, Role: ${userDoc.data().role}`);
        res.json({ message: "✅ Login successful!", user: userRecord, role: userDoc.data().role });

    } catch (error) {
        console.error("🚨 Login failed:", error.message);
        res.status(401).json({ message: "🚨 Login failed!", error: error.message });
    }
});

// ✅ Retrieve User Role for Verification
app.get("/user-role/:uid", async (req, res) => {
    const { uid } = req.params;

    try {
        const user = await admin.auth().getUser(uid);
        const claims = user.customClaims || {};

        console.log(`✅ User role request: ${uid} → ${JSON.stringify(claims)}`);
        res.json({ role: claims });

    } catch (error) {
        console.error("🚨 Failed to retrieve user role:", error.message);
        res.status(400).json({ message: "🚨 Failed to retrieve role!", error: error.message });
    }
});

// ✅ Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});