import { refreshAccessToken } from "./auth.js"; // Import token refreshing function

async function createMeeting() {
    // Get input values from the form
    const summary = document.getElementById("summary").value;
    const startDateTime = document.getElementById("start").value;
    const endDateTime = document.getElementById("end").value;

    // Validate inputs
    if (!summary || !startDateTime || !endDateTime) {
        document.getElementById("response").textContent = "Please fill in all fields.";
        return;
    }

    try {
        // 🔥 Get fresh Access Token dynamically
        const accessToken = await refreshAccessToken();

        // Convert input dates to ISO 8601 format
        function convertToISO(dateInput) {
            return new Date(dateInput).toISOString(); // Convert to YYYY-MM-DDTHH:mm:ssZ
        }

        const startISO = convertToISO(startDateTime);
        const endISO = convertToISO(endDateTime);

        // ✅ Google Calendar Event Data
        const eventData = {
            summary: summary,
            start: { dateTime: startISO, timeZone: "UTC" },
            end: { dateTime: endISO, timeZone: "UTC" },
            conferenceData: {
                createRequest: { requestId: Math.random().toString(36).substr(2, 9) } // Unique request ID
            }
        };

        // 🔥 Send API request to Google Calendar
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Use dynamic token
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(eventData)
            }
        );

        if (response.ok) {
            const data = await response.json();
            const meetLink = data.hangoutLink;

            // ✅ Display the Google Meet link
            document.getElementById("response").innerHTML = 
                `Google Meet Link: <a href="${meetLink}" target="_blank">${meetLink}</a>`;
        } else {
            // ❌ Handle errors properly
            const errorData = await response.json();
            console.error("API Error Details:", errorData);
            document.getElementById("response").textContent = "Failed to create meeting. Check the console for details.";
        }
    } catch (error) {
        console.error("🚨 Meeting Creation Error:", error);
        document.getElementById("response").textContent = "An unexpected error occurred. Please try again.";
    }
}

document.getElementById("createMeetingBtn").addEventListener("click", createMeeting);