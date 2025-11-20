import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const questionContainer = document.getElementById("question");
const answersContainer = document.getElementById("answers");
const timerDisplay = document.getElementById("timeLeft");
const nextButton = document.getElementById("nextQuestion");
const startQuizButton = document.getElementById("startQuiz"); // ✅ Start Quiz Button
const resultsContainer = document.getElementById("quizResults");
const scoreDisplay = document.getElementById("score");
const resultsList = document.getElementById("resultsList");
const recommendationDisplay = document.createElement("p"); // ✅ Recommendation Message

let currentQuestionIndex = 0;
let quizQuestions = [
    {
        question: "What is the basic unit of matter?",
        options: ["Atom", "Molecule", "Compound", "Electron"],
        correct: "Atom"
    },
    {
        question: "Which subatomic particle has a negative charge?",
        options: ["Proton", "Neutron", "Electron", "Nucleus"],
        correct: "Electron"
    },
    {
        question: "What do electrons orbit around in an atom?",
        options: ["Proton", "Neutron", "Nucleus", "Shell"],
        correct: "Nucleus"
    }
]; // ✅ Hardcoded Quiz Questions

let timeLeft = 30;
let timer;
let quizStarted = false;
let score = 0;
let userAnswers = [];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
});

// ✅ Start Quiz When Button is Clicked
startQuizButton.addEventListener("click", () => {
    quizStarted = true;
    startQuizButton.style.display = "none"; // ✅ Hide start button after clicking
    loadQuestion();
});

function loadQuestion() {
    if (!quizStarted) return; // ✅ Ensure quiz only starts when button is clicked

    clearInterval(timer);
    timeLeft = 30;
    timerDisplay.innerText = timeLeft;

    const questionData = quizQuestions[currentQuestionIndex];
    questionContainer.innerText = questionData.question;
    answersContainer.innerHTML = "";

    questionData.options.forEach(option => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("quiz-option"); // ✅ Add class for easy selection
        button.addEventListener("click", () => checkAnswer(option, questionData.correct));
        answersContainer.appendChild(button);
    });

    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft === 0) {
            clearInterval(timer);
            alert("🚨 Time's up! Moving to next question.");
            nextQuestion();
        }
    }, 1000);
}

function checkAnswer(selected, correct) {
    clearInterval(timer);

    // ✅ Disable all answer buttons to prevent multiple selections
    const allOptions = document.querySelectorAll(".quiz-option");
    allOptions.forEach(button => button.disabled = true);

    userAnswers.push({ question: quizQuestions[currentQuestionIndex].question, selected, correct });

    if (selected === correct) {
        score++;
    }
    nextButton.disabled = false;
}

nextButton.addEventListener("click", nextQuestion);

function nextQuestion() {
    if (timeLeft === 0 && !userAnswers[currentQuestionIndex]) {
        userAnswers.push({
            question: quizQuestions[currentQuestionIndex].question,
            selected: "❌ No Answer",
            correct: quizQuestions[currentQuestionIndex].correct
        });
    }

    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        loadQuestion();
        nextButton.disabled = true;
    } else {
        displayResults(); // ✅ Show results instead of redirecting
    }
}

// ✅ Display Results & Recommendations on Same Page
function displayResults() {
    questionContainer.style.display = "none";
    answersContainer.style.display = "none";
    timerDisplay.style.display = "none";
    nextButton.style.display = "none";

    resultsContainer.style.display = "block";
    scoreDisplay.innerHTML = `You scored <strong>${score}/${quizQuestions.length}</strong>!`;

    resultsList.innerHTML = "";
    userAnswers.forEach((item) => {
        const resultItem = document.createElement("li");
        resultItem.innerHTML = `<strong>${item.question}</strong><br> 
            Your Answer: <span style="color: ${item.selected === item.correct ? "green" : "red"};">${item.selected}</span> 
            | Correct Answer: <span style="color: green;">${item.correct}</span>`;
        resultsList.appendChild(resultItem);
    });

    // ✅ Determine Recommendation
    if (score / quizQuestions.length < 0.5) {
        recommendationDisplay.innerHTML = "🚨 You scored below 50%. Consider rewatching the lesson videos before moving on.";
        recommendationDisplay.style.color = "red";
    } else if (score / quizQuestions.length >= 0.5 && score / quizQuestions.length < 0.75) {
        recommendationDisplay.innerHTML = "🔄 You scored between 50% and 75%. Reviewing the lesson videos will help sharpen your understanding.";
        recommendationDisplay.style.color = "#ff9900"; // Orange for encouragement
    } else {
        recommendationDisplay.innerHTML = "🎉 Great job! You can move on to the next topic!";
        recommendationDisplay.style.color = "green";
    }

    resultsContainer.appendChild(recommendationDisplay);
}