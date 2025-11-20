document.addEventListener("DOMContentLoaded", () => {
    // ✅ Hardcoded Topic Information
    document.getElementById("topicTitle").textContent = "Cell Structure";
    document.getElementById("topicDescription").textContent =
        "Learn about the fundamental building blocks of matter, atomic theory, and electron configuration.";

    // ✅ Hardcoded PDF Link
    const pdfLinkEl = document.createElement("a");
    pdfLinkEl.href = "https://drive.google.com/example";
    pdfLinkEl.textContent = "📂 Download Notes PDF";
    pdfLinkEl.target = "_blank";
    document.getElementById("topicDescription").appendChild(pdfLinkEl);

    // ✅ Hardcoded Video List
    const videoGrid = document.getElementById("videoGrid");
    videoGrid.innerHTML = `
        <div class="video-item">
            <iframe width="100%" height="180" src="https://www.youtube.com/embed/-wWtp33i0q0" 
            title="Lesson 1 - Atomic Basics" frameborder="0" allowfullscreen></iframe>
            <p class="video-title">Lesson 1 - Atomic Basics</p>
        </div>

        <div class="video-item">
            <iframe width="100%" height="180" src="https://www.youtube.com/embed/lRBA92LkomQ" 
            title="Lesson 2 - Electron Configuration" frameborder="0" allowfullscreen></iframe>
            <p class="video-title">Lesson 2 - Electron Configuration</p>
        </div>

                <div class="video-item">
            <iframe width="100%" height="180" src="https://www.youtube.com/embed/7YgTEm_-i4U" 
            title="Lesson 2 - Electron Configuration" frameborder="0" allowfullscreen></iframe>
            <p class="video-title">Lesson 3 - identification</p>
        </div>
    `;
});
document.getElementById("startQuiz").addEventListener("click", () => {
    window.location.href = "../chem3quizs/chm3quiztp4.html"; // ✅ Redirects user to quiz page
});