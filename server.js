import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import path from "path";

// ✅ Load Firebase Admin credentials from environment variables
admin.initializeApp({
    credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    }),
});

const db = admin.firestore(); // Firestore instance for Admin SDK

const app = express();
const PORT = process.env.PORT || 3000; // Use Render's PORT

app.use(cors()); // Enable CORS
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(process.cwd(), "public")));

// Default landing page route
app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "home_page.html"));
});

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
            email,
            role,
            createdAt: new Date(),
        });

        console.log(`✅ Assigned role '${role}' to ${email}`);
        res.json({ message: "✅ Registration successful!", user: userRecord });

    } catch (error) {
        console.error("🚨 Registration failed:", error.message);
        res.status(400).json({ message: "🚨 Registration failed!", error: error.message });
    }
});

// ✅ Handle Login Requests
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "🚨 Email and password are required!" });
    }

    try {
        // ✅ Retrieve user from Firebase Authentication
        const userRecord = await admin.auth().getUserByEmail(email);

        // ❌ Passwords cannot be verified via Admin SDK
        // Clients must authenticate with Firebase Auth SDK

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

// ✅ Retrieve User Role
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

// ✅ Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
