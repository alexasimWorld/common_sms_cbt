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
    resultBox.innerHTML = `Your score: ${correct} / ${currentSet.length} (${percent}%)`;

    // ✅ Load stored user info
    const creds = JSON.parse(localStorage.getItem("userCredentials") || "{}");
    const { firstName = "Anonymous", lastName = "", rank = "" } = creds;

    // ✅ Save certificate data for next page
    const certData = {
        firstName, lastName, rank, score: percent,
        date: new Date().toLocaleDateString()
    };
    sessionStorage.setItem("certificateData", JSON.stringify(certData));

    // ✅ Define passing score
    const PASS_MARK = 1;

    if (percent >= PASS_MARK) {
        // 🎉 Passed — show congratulatory message with clickable link
        resultBox.innerHTML += `
            <p style="color:green; font-weight:bold; margin-top:15px;">
                🎉 Congratulations, you have passed with ${percent}%.
                <a href="#" id="viewCertificate" style="color:#007bff; text-decoration:underline; cursor:pointer;">
                    Click here to view your certificate
                </a>
            </p>
        `;

        document.getElementById("viewCertificate").onclick = () => {
            window.location.href = "certificate.html?auto=1";
        };
    } else {
        // ❌ Failed
        resultBox.innerHTML += `
            <p style="color:red; margin-top:15px;">
                You scored below the required ${PASS_MARK}%. Please try again.
            </p>
        `;
    }

    resultBox.classList.remove("hidden");
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

