// ---------- QUIZ SYSTEM ---------- updated 10/11/25 15:13//
console.log("✅ quiz.js loaded dynamically.");

let allQuestions = [];
let currentSet = [];
let index = 0;
let score = 0;
let userAnswers = {};

// === Load Quiz Data ===
async function loadQuiz() {
    try {
        console.log("📥 Loading quiz data from questions/json/allquestions_fixed.json...");
        const res = await fetch("questions/json/allquestions_fixed.json");
        const data = await res.json();

        // 🧠 Detect the structure automatically
        if (Array.isArray(data)) {
            // Could be either a flat list of questions or chapter objects
            if (data[0] && data[0].questions) {
                console.log("📗 Detected multi-section structure.");

                // Flatten and tag each question with its section name
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

        if (!allQuestions.length) throw new Error("No questions found in allquestions_fixed.json");

        // ✅ Randomize order and pick 20
        currentSet = shuffle([...allQuestions]).slice(0, 20);
        index = 0;
        score = 0;
        userAnswers = {};

        showQuestion();
        console.log("✅ Loaded", currentSet.length, "questions.");
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

    // Update header
    progressBox.textContent = `Question ${index + 1} / ${currentSet.length}`;
    resultBox.classList.add("hidden");

    // Render question text
    questionBox.textContent = q.question;

    // Render choices
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

    // Save user answer
    userAnswers[index] = selectedIndex;

    // Highlight choice
    const buttons = document.querySelectorAll(".quiz-choice-btn");
    buttons.forEach((btn, i) => {
        btn.classList.remove("selected", "correct", "wrong");
        if (i === selectedIndex) btn.classList.add("selected");
    });

    // Optional: immediate feedback
    // if (selectedIndex === q.options.indexOf(q.answer))
    //     buttons[selectedIndex].classList.add("correct");
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
}

// Attach events
document.getElementById("quiz-next").onclick = nextQuestion;
document.getElementById("quiz-prev").onclick = prevQuestion;

// Export
(function (global) {
    global.loadQuiz = loadQuiz;
    global.showQuestion = showQuestion;
    global.handleAnswer = handleAnswer;
    global.prevQuestion = prevQuestion;
    global.nextQuestion = nextQuestion;
    global.showResults = showResults;
    console.log("🌍 quiz.js: functions exported to global window");
})(typeof window !== "undefined" ? window : this);
