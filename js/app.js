/* =======================================
   Company CBT - Application Logic
   ======================================= */

// ---------- LOGIN / LOGOUT ---------- //
function login() {
    const first = document.getElementById('firstName').value.trim();
    const last = document.getElementById('lastName').value.trim();
    const rank = document.getElementById('rank').value.trim();

    if (!first || !last || !rank) {
        alert("Please fill in all fields.");
        return;
    }

    localStorage.setItem("cbt_user", JSON.stringify({ first, last, rank }));
    window.location.href = "main.html";
}

function logout() {
    localStorage.removeItem("cbt_user");
    window.location.href = "index.html";
}

function getUser() {
    const stored = localStorage.getItem("cbt_user");
    return stored ? JSON.parse(stored) : null;
}

// ---------- SIDEBAR RENDERING ---------- //
function renderSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const user = getUser();

    sidebar.innerHTML = `
        <div class="sidebar-content">
            <img src="assets/images/commonpro/logo.png" alt="Logo" class="sidebar-logo">
            <img src="assets/images/commonpro/vessel.png" alt="Vessel" class="sidebar-vessel">
            ${user ? `
                <div class="user-info">
                    <p><b>${user.first} ${user.last}</b></p>
                    <p>${user.rank}</p>
                </div>
            ` : `<p>No user data.</p>`}
            <div class="sidebar-buttons">
                <button onclick="goHome()">🏠 Home</button>
                <button onclick="startPresentation()">📘 Presentation</button>
                <button onclick="startQuiz()">🧠 Take Quiz</button>
                <button onclick="logout()">🚪 Logout</button>
            </div>
        </div>
    `;

    console.log("✅ Sidebar rendered");
}

// ---------- Go home function ---------- //
function goHome() {
    console.log("🏠 Returning to Home screen...");
    const intro = document.getElementById("intro-screen");
    const pres = document.getElementById("presentation-area");
    const quiz = document.getElementById("quiz-area");

    // Hide all others
    pres.classList.add("hidden");
    quiz.classList.add("hidden");

    // Show intro again
    intro.classList.remove("hidden");
    intro.style.animation = "fadeIn 0.6s ease";
}




// ---------- PRESENTATION SYSTEM (HTML VERSION FOR main.html) ---------- //

// Called when user clicks "Start Presentation"
function startPresentation() {
    console.log("📘 Switching to Presentation section...");

    const intro = document.getElementById("intro-screen");
    const pres = document.getElementById("presentation-area");
    const quiz = document.getElementById("quiz-area");

    if (!intro || !pres || !quiz) {
        console.error("❌ Missing one of the main sections (intro/presentation/quiz).");
        return;
    }

    // Hide intro + quiz
    intro.classList.add("hidden");
    quiz.classList.add("hidden");

    // Show presentation
    pres.classList.remove("hidden");
    pres.style.animation = "fadeIn 0.6s ease";

    // ✅ Load presentation HTML if not already loaded
    const chapterDiv = document.getElementById("chapter-content");
    if (chapterDiv && !chapterDiv.hasChildNodes()) {
        console.log("📘 Loading presentation content...");
        loadHTMLPresentation();
    }
}



// Loads the pre-converted HTML presentation
let slides = [];
let currentSlideIndex = 0;

function loadHTMLPresentation() {
    const chapterDiv = document.getElementById("chapter-content");
    const titleSpan = document.getElementById("chapter-title");
    if (!chapterDiv || !titleSpan) return;

    console.log("📘 Loading presentation slides...");

    fetch("presentation/content/allchapters.html")
        .then(res => {
            if (!res.ok) throw new Error("Could not load allchapters.html");
            return res.text();
        })
        .then(html => {
            const temp = document.createElement("div");
            temp.innerHTML = html;

            // Split into slides using <h1> or <h2>
            const sections = [];
            let currentSection = document.createElement("div");
            temp.childNodes.forEach(node => {
                if (node.tagName === "H1" || node.tagName === "H2") {
                    if (currentSection.childNodes.length) {
                        sections.push(currentSection);
                        currentSection = document.createElement("div");
                    }
                }
                currentSection.appendChild(node.cloneNode(true));
            });
            if (currentSection.childNodes.length) sections.push(currentSection);

            slides = sections;
            console.log(`✅ Found ${slides.length} slides.`);

            currentSlideIndex = 0;
            showSlide(currentSlideIndex);
        })
        .catch(err => {
            console.error("❌ Error loading HTML:", err);
            chapterDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
        });
}

function showSlide(index) {
    const chapterDiv = document.getElementById("chapter-content");
    const titleSpan = document.getElementById("chapter-title");

    if (!slides.length) return;
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;

    chapterDiv.innerHTML = "";
    const slide = slides[index].cloneNode(true);
    chapterDiv.appendChild(slide);

    // Add nice animation
    chapterDiv.style.opacity = 0;
    setTimeout(() => {
        chapterDiv.style.transition = "opacity 0.6s ease";
        chapterDiv.style.opacity = 1;
    }, 50);

    // Update title
    const title = slide.querySelector("h1, h2");
    titleSpan.textContent = title ? title.textContent : `Slide ${index + 1}`;
}

function loadNext() {
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        showSlide(currentSlideIndex);
    }
}

function loadPrevious() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        showSlide(currentSlideIndex);
    }
}




/* ============ QUIZ SYSTEM ============ */

// Holds the active question for the hint robot
let currentQuestion = null;

// Unified quiz data
let QUIZ_BANK = [];
const QUIZ_SIZE = 20;

// Utility: Shuffle array
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// -------------------------------
// Load unified allquestions_fixed.json
// -------------------------------
async function loadQuizBank() {
    try {
        const res = await fetch("questions/json/allquestions_fixed.json");
        if (!res.ok) throw new Error("Missing allquestions_fixed.json");

        const json = await res.json();
        QUIZ_BANK = [];

        if (Array.isArray(json)) {
            // Detect structure: either [{section, questions:[...]}] or flat [{question, choices:...}]
            if (json[0] && json[0].questions) {
                // Multi-chapter style
                json.forEach(chapter => {
                    const chapterName = chapter.section || "Unknown Section";
                    (chapter.questions || []).forEach(q => {
                        const choices = Array.isArray(q.options) ? [...q.options] : [];
                        const answerText = (q.answer || "").trim();
                        let correctIndex = choices.findIndex(
                            c => (c || "").trim().toLowerCase() === answerText.toLowerCase()
                        );
                        if (correctIndex < 0) correctIndex = 0;

                        QUIZ_BANK.push({
                            question: q.question || "",
                            choices,
                            correctIndex,
                            correctText: answerText,
                            Reason: q.explanation || "",
                            chapter: chapterName
                        });
                    });
                });
            } else {
                // Flat format
                json.forEach(q => {
                    const choices = Array.isArray(q.options) ? [...q.options] : [];
                    const answerText = (q.answer || "").trim();
                    let correctIndex = choices.findIndex(
                        c => (c || "").trim().toLowerCase() === answerText.toLowerCase()
                    );
                    if (correctIndex < 0) correctIndex = 0;

                    QUIZ_BANK.push({
                        question: q.question || "",
                        choices,
                        correctIndex,
                        correctText: answerText,
                        Reason: q.explanation || "",
                        chapter: q.chapter || "General"
                    });
                });
            }
        }

        console.log(`✅ Loaded ${QUIZ_BANK.length} total questions from allquestions_fixed.json`);
    } catch (err) {
        console.error("⚠️ Could not load quiz bank:", err);
        QUIZ_BANK = [
            {
                question: "What is the primary purpose of the Company's Safety Management System (SMS)?",
                choices: [
                    "To promote HSQE excellence and continuous improvement",
                    "To reduce crew onboard time",
                    "To increase cargo capacity beyond limits",
                    "To replace navigational procedures with automation"
                ],
                correctIndex: 0,
                Reason: "The SMS ensures safe ship operation and compliance with maritime standards.",
                chapter: "Fallback"
            }
        ];
    }
}

// -------------------------------
// Build and run a quiz attempt
// -------------------------------
let quizState = {
    picked: [],
    index: 0,
    answers: {},
    finished: false
};

function buildAttempt() {
    const bank = [...QUIZ_BANK];
    const picked = shuffle(bank).slice(0, QUIZ_SIZE);

    quizState.picked = picked.map(src => {
        const choices = [...src.choices];
        shuffle(choices);
        const idx = choices.findIndex(
            c =>
                (c || "").trim().toLowerCase() ===
                (src.correctText || "").trim().toLowerCase()
        );
        const correctIndex = idx >= 0 ? idx : 0;

        return {
            question: src.question,
            choices,
            correctIndex,
            chapter: src.chapter || null,
            Reason: src.Reason || ""
        };
    });

    quizState.index = 0;
    quizState.answers = {};
    quizState.finished = false;
}

// -------------------------------
// Render current question
// -------------------------------
function renderQuiz() {
    const q = quizState.picked[quizState.index];
    window.currentQuestion = q; // expose for robot

    const progress = document.getElementById("quiz-progress");
    const best = document.getElementById("best-score");
    const qDiv = document.getElementById("quiz-question");
    const cDiv = document.getElementById("quiz-choices");
    const resDiv = document.getElementById("quiz-result");
    const prevBtn = document.getElementById("quiz-prev");
    const nextBtn = document.getElementById("quiz-next");
    const submitBtn = document.getElementById("quiz-submit");

    console.log("📘 Current Question:", q.question, "Reason:", q.Reason);

    progress.textContent = `Question ${quizState.index + 1}/${quizState.picked.length}`;
    best.textContent = `${getBestScore()}%`;
    qDiv.textContent = q.question;

    cDiv.innerHTML = "";
    q.choices.forEach((choice, i) => {
        const id = `choice-${i}`;
        const wrapper = document.createElement("label");
        wrapper.setAttribute("for", id);

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "quiz-choice";
        input.id = id;
        input.value = String(i);
        if (quizState.answers[quizState.index] === i) input.checked = true;
        input.addEventListener("change", () => {
            quizState.answers[quizState.index] = i;
        });

        wrapper.appendChild(input);
        wrapper.appendChild(document.createTextNode(choice));
        cDiv.appendChild(wrapper);
    });

    prevBtn.disabled = quizState.index === 0;
    nextBtn.classList.toggle("hidden", quizState.index === quizState.picked.length - 1);
    submitBtn.classList.toggle("hidden", quizState.index !== quizState.picked.length - 1);

    resDiv.classList.add("hidden");
    resDiv.classList.remove("correct", "incorrect");
    resDiv.textContent = "";
}

// -------------------------------
// Quiz Navigation + Scoring
// -------------------------------
function quizPrev() {
    if (quizState.index > 0) {
        quizState.index--;
        renderQuiz();
        scrollQuizTop();
    }
}
function quizNext() {
    if (quizState.index < quizState.picked.length - 1) {
        quizState.index++;
        renderQuiz();
        scrollQuizTop();
    }
}
function scrollQuizTop() {
    const qa = document.getElementById("quiz-area");
    if (qa) qa.scrollTo({ top: 0, behavior: "smooth" });
}

function submitQuiz() {
    const resDiv = document.getElementById("quiz-result");
    let correct = 0;
    quizState.picked.forEach((q, idx) => {
        const picked = quizState.answers[idx];
        if (picked === q.correctIndex) correct++;
    });
    const score = Math.round((correct / quizState.picked.length) * 100);
    resDiv.textContent = `Your score: ${score}% (${correct}/${quizState.picked.length})`;
    resDiv.classList.remove("hidden");
    resDiv.classList.add(score >= 70 ? "correct" : "incorrect");
    quizState.finished = true;
    saveBestScore(score);
}

// -------------------------------
// Local storage for best score
// -------------------------------
function saveBestScore(score) {
    const user = getUser();
    const key = user ? `cbt_best_${user.first}_${user.last}` : "cbt_best";
    const prev = parseInt(localStorage.getItem(key) || "0", 10);
    if (score > prev) localStorage.setItem(key, String(score));
    document.getElementById("best-score").textContent = `${getBestScore()}%`;
}
function getBestScore() {
    const user = getUser();
    const key = user ? `cbt_best_${user.first}_${user.last}` : "cbt_best";
    return parseInt(localStorage.getItem(key) || "0", 10);
}

// -------------------------------
// Wire buttons and start quiz
// -------------------------------
function wireQuizButtons() {
    const prevBtn = document.getElementById("quiz-prev");
    const nextBtn = document.getElementById("quiz-next");
    const submitBtn = document.getElementById("quiz-submit");
    if (prevBtn && nextBtn && submitBtn) {
        prevBtn.onclick = quizPrev;
        nextBtn.onclick = quizNext;
        submitBtn.onclick = submitQuiz;
    }
}

// -----------------------------------------------------
// 🧠 Start Quiz (Dynamic HTML + Script Loader)
// -----------------------------------------------------
function startQuiz() {
    console.log("🧠 Starting internal quiz section...");

    const intro = document.getElementById("intro-screen");
    const pres = document.getElementById("presentation-area");
    const quiz = document.getElementById("quiz-area");

    if (!intro || !pres || !quiz) {
        console.error("❌ One of the main sections is missing.");
        return;
    }

    // Hide intro & presentation
    intro.classList.add("hidden");
    pres.classList.add("hidden");

    // Show quiz area
    quiz.classList.remove("hidden");
    quiz.style.animation = "fadeIn 0.8s ease";

    // Ensure quiz.js is loaded
    if (typeof window.loadQuiz === "function") {
        console.log("🚀 loadQuiz() found — launching quiz...");
        window.loadQuiz();
    } else {
        console.warn("⚠️ loadQuiz() not found yet — loading quiz.js dynamically...");
        loadScript("js/quiz.js", () => {
            if (typeof window.loadQuiz === "function") {
                console.log("✅ quiz.js loaded — launching quiz...");
                window.loadQuiz();
            } else {
                console.error("❌ loadQuiz() still missing after script load.");
            }
        });
    }
}



// ---------- INITIALIZATION ---------- //
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ app.js initialized");
    renderSidebar();

    const user = getUser();
    const welcomeText = document.getElementById("welcome");
    if (user && welcomeText) {
        welcomeText.innerText = `Welcome aboard, ${user.first}!`;
    }
});


/* =======================================
   🤖 Nautical Robot Assistant
   ======================================= */

document.addEventListener("DOMContentLoaded", () => {
    const robot = document.getElementById("nautical-robot");
    const flag = document.getElementById("robot-flag");
    const bubble = document.getElementById("hint-bubble");

    if (!robot || !flag || !bubble) return;

    // Gentle floating animation
    let floatDir = 1;
    setInterval(() => {
        const y = parseFloat(robot.style.bottom || "100");
        robot.style.bottom = (100 + Math.sin(Date.now() / 1000) * 8) + "px";
    }, 60);

    // Hide robot during presentation mode
    const observer = new MutationObserver(() => {
        const presVisible = !document.getElementById("presentation-area")?.classList.contains("hidden");
        robot.style.display = presVisible ? "none" : "block";
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });


    // When the user clicks on the flag or robot
    robot.addEventListener("click", () => {
        let message = "";

        // Determine context
        const quizVisible = !document.getElementById("quiz-area")?.classList.contains("hidden");
        const introVisible = !document.getElementById("intro-screen")?.classList.contains("hidden");

        if (introVisible) {
            message = "Choose to view the Company's presentation or click on the Quiz to test your knowledge.";
        }
        else if (quizVisible && window.currentQuestion) {
            const q = window.currentQuestion;

            // Only show the explanation as the hint
            const reason =
                q.explanation || q.Reason || q.reason || "No hint available for this question.";

            message = `
        <b>💡 Hint:</b><br>${reason}
    `;
        }




        // Toggle bubble
        if (bubble.style.display === "block") {
            bubble.style.display = "none";
        } else {
            bubble.innerHTML = message;
            bubble.style.display = "block";
            bubble.style.animation = "fadeIn 0.3s ease-out";
        }
    });

    // Hide bubble when clicking elsewhere
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#nautical-robot") && !e.target.closest("#hint-bubble")) {
            bubble.style.display = "none";
        }
    });
});

// -----------------------------------------------------
// ⚡ Dynamic Script Loader (for sections like Quiz)
// -----------------------------------------------------
function loadScript(src, callback) {
    if (document.querySelector(`script[src="${src}"]`)) {
        console.log("ℹ️ Script already loaded:", src);
        if (callback) callback();
        return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
        console.log("✅ Script loaded:", src);
        if (callback) callback();
    };
    script.onerror = () => console.error("❌ Failed to load script:", src);
    document.body.appendChild(script);
}