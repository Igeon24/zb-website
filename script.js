let allQuestions = [];
let selectedQuestions = [];
let index = 0;
let score = 0;
let currentCategory = "any";
const QUESTIONS_PER_SESSION = 20;

/* Load questions */
async function loadQuestions() {
    const res = await fetch("questions.json");
    const data = await res.json();
    allQuestions = data.questions;
    showLeaderboard(); // show highest scores on home page
}
loadQuestions();

/* Start Quiz */
function startQuiz() {
    if (allQuestions.length === 0) {
        alert("Questions are still loading. Please wait a moment.");
        return;
    }

    currentCategory = document.getElementById("categorySelect").value;

    let pool = currentCategory === "any" 
        ? allQuestions 
        : allQuestions.filter(q => q.category === currentCategory);

    selectedQuestions = pool.sort(() => Math.random() - 0.5)
                            .slice(0, Math.min(QUESTIONS_PER_SESSION, pool.length));

    index = 0;
    score = 0;

    document.getElementById("categoryBox").style.display = "none";
    document.getElementById("quizBox").style.display = "block";

    updateProgress();
    showQuestion();
    showMainMenuBtn();
}

/* Display Question */
function showQuestion() {
    const q = selectedQuestions[index];

    // Show category outside question box
    document.getElementById("categoryDisplay").textContent = `Category: ${currentCategory}`;

    document.getElementById("question").textContent = q.question;

    const choiceBox = document.getElementById("choices");
    choiceBox.innerHTML = "";

    q.choices.forEach(choice => {
        const btn = document.createElement("div");
        btn.className = "choice";
        btn.textContent = choice;
        btn.onclick = () => selectAnswer(btn, q.answer, q.explanation);
        choiceBox.appendChild(btn);
    });
}

/* When user selects an answer */
function selectAnswer(btn, correct, explanation) {
    const options = document.querySelectorAll(".choice");
    options.forEach(o => o.style.pointerEvents = "none");

    if (btn.textContent === correct) {
        btn.classList.add("correct");
        score++;
    } else {
        btn.classList.add("wrong");
        options.forEach(o => {
            if (o.textContent === correct) o.classList.add("correct");
        });
    }

    if (explanation) {
        const exp = document.createElement("p");
        exp.className = "explanation";
        exp.textContent = explanation;
        document.getElementById("choices").appendChild(exp);
    }

    document.getElementById("nextBtn").style.display = "block";
}

/* Next Question */
document.getElementById("nextBtn").onclick = () => {
    index++;
    if (index < selectedQuestions.length) {
        updateProgress();
        showQuestion();
        document.getElementById("nextBtn").style.display = "none";
    } else {
        finishQuiz();
    }
};

/* Progress bar */
function updateProgress() {
    const percent = ((index + 1) / selectedQuestions.length) * 100;
    document.getElementById("progressBar").style.width = percent + "%";
}

/* Save Score + Highest Score per Category */
function saveScore(category) {
    const prev = JSON.parse(localStorage.getItem("scores") || "[]");

    prev.push({
        category,
        score,
        total: selectedQuestions.length,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("scores", JSON.stringify(prev));

    const highs = JSON.parse(localStorage.getItem("highScores") || "{}");
    const best = highs[category] || 0;
    if (score > best) {
        highs[category] = score;
        localStorage.setItem("highScores", JSON.stringify(highs));
    }
}

/* Final Screen */
function finishQuiz() {
    saveScore(currentCategory);

    const app = document.getElementById("app");

    const history = JSON.parse(localStorage.getItem("scores") || "[]");
    const highs = JSON.parse(localStorage.getItem("highScores") || "{}");

    let listItems = history.slice(-5).map(
        s => `<li>${s.category}: ${s.score}/${s.total} – <small>${s.date}</small></li>`
    ).join("");

    app.innerHTML = `
        <h2>Quiz Finished 🎉</h2>
        <p>Category: <strong>${currentCategory}</strong></p>
        <p>You scored <strong>${score}</strong> out of <strong>${selectedQuestions.length}</strong></p>
        <p>Highest score in <strong>${currentCategory}</strong>: ${highs[currentCategory] || score}</p>

        <h3>Last Scores:</h3>
        <ul>${listItems}</ul>

        <button onclick="location.reload()">Restart</button>
    `;

    showMainMenuBtn();
}

/* Show Main Menu button inside quiz box */
function showMainMenuBtn() {
    let btn = document.getElementById("mainMenuBtn");
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "mainMenuBtn";
        btn.textContent = "Main Menu";
        btn.onclick = goHome;
        document.getElementById("quizBox").appendChild(btn);
    }
    btn.style.display = "block";
}

/* Go back to main menu */
function goHome() {
    document.getElementById("quizBox").style.display = "none";
    document.getElementById("categoryBox").style.display = "block";
    document.getElementById("progressBar").style.width = "0%";

    const btn = document.getElementById("mainMenuBtn");
    if (btn) btn.style.display = "none";

    showLeaderboard(); // refresh leaderboard live
}

/* Show leaderboard of highest scores on home page */
function showLeaderboard() {
    const highs = JSON.parse(localStorage.getItem("highScores") || "{}");
    let leaderboardHTML = "<h3>Highest Scores</h3><ul>";

    const categories = [
        "Word Knowledge",
        "Paragraph Comprehension",
        "Arithmetic Reasoning",
        "Auto and Shop Information",
        "Mechanical Comprehension",
        "Assembling Objects"
    ];

    categories.forEach(cat => {
        leaderboardHTML += `<li>${cat}: ${highs[cat] || 0}</li>`;
    });

    leaderboardHTML += "</ul>";

    // Replace or update leaderboard in categoryBox
    let existing = document.getElementById("leaderboard");
    if (!existing) {
        const div = document.createElement("div");
        div.id = "leaderboard";
        div.innerHTML = leaderboardHTML;
        document.getElementById("categoryBox").appendChild(div);
    } else {
        existing.innerHTML = leaderboardHTML;
    }
}
