document.getElementById("courseForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission reload

    const saveButton = document.querySelector("button[type='submit']"); // ✅ Select save button
    saveButton.innerHTML = `<span class="spinner"></span> Saving...`; // ✅ Show spinner text
    saveButton.disabled = true; // ✅ Disable button to prevent multiple clicks

    const selectedCourses = {};
    document.querySelectorAll('input[name="courses"]:checked').forEach(course => {
        selectedCourses[course.value] = { subscriptionActive: false, verified: false, transactionId: null };
    });

    if (Object.keys(selectedCourses).length > 0) {
        localStorage.setItem("userCourses", JSON.stringify(selectedCourses)); // ✅ Store courses as an object

        setTimeout(() => {
            // ✅ Restore button after successful save
            saveButton.innerHTML = "Save & Continue";
            saveButton.disabled = false;
            window.location.href = "dashboard.html"; // Redirect to the dashboard
        }, 1000); // ✅ Added slight delay for smoother UI transition

    } else {
        saveButton.innerHTML = "Save & Continue"; // ✅ Restore button on error
        saveButton.disabled = false;
        alert("🚨 Please select at least one course.");
    }
});