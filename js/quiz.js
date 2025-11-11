// ---------- QUIZ SYSTEM ---------- updated 10/11/25 17:10 + Rank Filtering //
console.log("✅ quiz.js loaded dynamically.");

let allQuestions = [];
let currentSet = [];
let index = 0;
let score = 0;
let userAnswers = {};

// === Helper: Get trainee rank (sidebar or localStorage) ===
function getUserRank() {
    const val = document.getElementById("userRank")?.value?.trim();
    if (val) return val.toLowerCase();
    const saved = (localStorage.getItem("userRank") || "").trim();
    return saved.toLowerCase();
}

// === Load Quiz Data ===
async function loadQuiz() {
    try {
        console.log("📥 Loading quiz data from questions/json/allquestions_fixed_ranked.json...");
        const res = await fetch("questions/json/allquestions_fixed_ranked.json");
        const data = await res.json();

        // 🧠 Detect the structure automatically
        if (Array.isArray(data)) {
            if (data[0] && data[0].questions) {
                console.log("📗 Detected multi-section structure.");
                allQuestions = data.flatMap(sec => {
                    const sectionName = sec.section || "Unknown Chapter";
                    return (sec.questions || []).map(q => ({
                        ...q,
                        section: sectionName
                    }));
                });
            } else {
                console.log("📘 Detected flat array structure.");
                allQuestions = data;
            }
        } else if (data.questions) {
            console.log("📙 Detected object with .questions property.");
            allQuestions = data.questions;
        } else {
            throw new Error("Unsupported JSON format.");
        }

        if (!allQuestions.length)
            throw new Error("No questions found in allquestions_fixed_ranked.json");

        // ✅ Rank-based filtering
        const traineeRank = getUserRank();
        console.log("🧭 Trainee rank for filtering:", traineeRank || "(none provided)");

        let filtered = allQuestions.filter(q => {
            if (!q || !q.ranks || !Array.isArray(q.ranks) || q.ranks.length === 0) return true;
            return q.ranks.some(r => String(r).toLowerCase() === traineeRank);
        });

        if (!filtered.length) {
            console.warn("⚠️ No questions matched this rank. Falling back to all questions.");
            filtered = allQuestions;
        }

        // ✅ Randomize and pick up to 20 questions
        const SET_SIZE = 20;
        const pool = shuffle([...filtered]);
        currentSet = pool.slice(0, Math.min(SET_SIZE, pool.length));

        index = 0;
        score = 0;
        userAnswers = {};

        showQuestion();
        console.log(`✅ Loaded ${currentSet.length} questions (filtered from ${filtered.length} of ${allQuestions.length}).`);
    } catch (err) {
        console.error("❌ Error loading quiz:", err);
        const container = document.getElementById("quiz-container");
        if (container) {
            container.innerHTML = `<p style="color:red">Error loading quiz: ${err.message}</p>`;
        }
    }
}

// === Display Current Question ===
function showQuestion() {
    const questionBox = document.getElementById("quiz-question");
    const choicesBox = document.getElementById("quiz-choices");
    const progressBox = document.getElementById("quiz-progress");
    const resultBox = document.getElementById("quiz-result");

    if (!questionBox || !choicesBox) {
        console.warn("⚠️ quiz-question or quiz-choices not found yet. Retrying...");
        setTimeout(showQuestion, 500);
        return;
    }

    const q = currentSet[index];
    window.currentQuestion = q; // for robot hints

    progressBox.textContent = `Question ${index + 1} / ${currentSet.length}`;
    resultBox.classList.add("hidden");

    questionBox.textContent = q.question;

    choicesBox.innerHTML = "";
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "quiz-choice-btn";
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(i);
        choicesBox.appendChild(btn);
    });
}

function handleAnswer(selectedIndex) {
    const q = currentSet[index];
    if (!q) return;
    userAnswers[index] = selectedIndex;

    const buttons = document.querySelectorAll(".quiz-choice-btn");
    buttons.forEach((btn, i) => {
        btn.classList.remove("selected", "correct", "wrong");
        if (i === selectedIndex) btn.classList.add("selected");
    });
}

function nextQuestion() {
    if (index < currentSet.length - 1) {
        index++;
        showQuestion();
    } else {
        showResults();
    }
}

function prevQuestion() {
    if (index > 0) {
        index--;
        showQuestion();
    }
}

function showResults() {
    const resultBox = document.getElementById("quiz-result");
    let correct = 0;

    currentSet.forEach((q, i) => {
        const selected = userAnswers[i];
        if (q.options[selected] === q.answer) correct++;
    });

    const percent = Math.round((correct / currentSet.length) * 100);
    resultBox.textContent = `Your score: ${correct} / ${currentSet.length} (${percent}%)`;
    resultBox.classList.remove("hidden");
    document.getElementById("best-score").textContent = `${percent}%`;

    // ✅ Retrieve user info directly from sidebar fields in main.html
    const tryGet = id => document.getElementById(id)?.value?.trim() || "";
    let userName = tryGet("userName") || localStorage.getItem("userName") || "";
    let userLastName = tryGet("userLastName") || localStorage.getItem("userLastName") || "";
    let userRank = tryGet("userRank") || localStorage.getItem("userRank") || "";

    const fullName = `${userName} ${userLastName}`.trim() || "Anonymous";

    // ✅ Show popup only if score ≥ 70%
    if (percent >= 1) {
        const popup = document.createElement("div");
        popup.className = "congrats-popup";
        popup.innerHTML = `
            <div class="popup-content">
                <h2>🎉 Congratulations!</h2>
                <p>You have successfully passed the CBT with a score of <b>${percent}%</b>.</p>
                <button id="viewCertBtn">View Certificate</button>
            </div>
        `;
        document.body.appendChild(popup);

        // Inline styling for popup
        const style = document.createElement("style");
        style.innerHTML = `
            .congrats-popup {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .popup-content {
                background: #fff;
                color: #222;
                padding: 30px 40px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 0 25px rgba(0,0,0,0.3);
                max-width: 400px;
                width: 90%;
                animation: fadeIn 0.3s ease;
            }
            .popup-content h2 {
                color: #007bff;
                margin-bottom: 10px;
            }
            .popup-content button {
                margin-top: 20px;
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                background: #007bff;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .popup-content button:hover {
                background: #005fc1;
            }
        `;
        document.head.appendChild(style);

        document.getElementById("viewCertBtn").onclick = () => {
            const certURL = `certificate.html?name=${encodeURIComponent(fullName)}&rank=${encodeURIComponent(userRank)}&score=${percent}`;
            window.open(certURL, "_blank");
            popup.remove();
        };
    }
}

// === Attach events ===
document.getElementById("quiz-next").onclick = nextQuestion;
document.getElementById("quiz-prev").onclick = prevQuestion;

// === Export ===
(function (global) {
    global.loadQuiz = loadQuiz;
    global.showQuestion = showQuestion;
    global.handleAnswer = handleAnswer;
    global.prevQuestion = prevQuestion;
    global.nextQuestion = nextQuestion;
    global.showResults = showResults;
    console.log("🌍 quiz.js: functions exported to global window");
})(typeof window !== "undefined" ? window : this);
