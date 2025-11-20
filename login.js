document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // 🔥 Send login request to the backend server (`server.js`)
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log("Login Response:", data);

        if (response.ok) {
            alert("Login Successful!");
            window.location.href = "dashboard.html"; // Redirect after login
        } else {
            alert("Login Failed: " + data.message);
        }
    } catch (error) {
        alert("Unexpected Error: " + error.message);
    }
});