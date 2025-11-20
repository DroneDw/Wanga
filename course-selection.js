document.getElementById("courseForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form submission reload

    const selectedCourses = [];
    document.querySelectorAll('input[name="courses"]:checked').forEach(course => {
        selectedCourses.push(course.value);
    });

    if (selectedCourses.length > 0) {
        localStorage.setItem("userCourses", JSON.stringify(selectedCourses));
        window.location.href = "dashboard.html"; // Redirect to the dashboard
    } else {
        alert("Please select at least one course.");
    }
});
