const words = [
    "Safety", "Navigation", "Innovation", "Bridge", "Anchor", "Crew",
    "Seamanship", "Integrity", "Vessel", "Compliance", "Engine Room",
    "Teamwork", "Sustainability", "Training", "Maintenance"
];
const colors = ["#00aaff", "#00ffaa", "#ffaa00", "#ff0066", "#aaff00", "#00ffff"];

const orbit = document.getElementById("orbit-container");
const bubble = document.getElementById("jarvis-bubble");
const user = getUser();

if (user && document.getElementById("welcome")) {
    document.getElementById("welcome").innerText = `Welcome aboard, ${user.first}!`;
}

/* --- Orbit Game Variables --- */
let clickCount = 0;
let orbitScale = 1.0;
let baseRadius = 210; // baseline distance from center


/* --- Create Orbit Words --- */
function createWords() {
    orbit.innerHTML = "";
    const count = 12;
    for (let i = 0; i < count; i++) {
        const w = document.createElement("span");
        w.textContent = words[Math.floor(Math.random() * words.length)];
        w.className = "orbit-word";
        w.style.setProperty("--angle", `${i * (360 / count)}deg`);
        w.style.color = colors[Math.floor(Math.random() * colors.length)];
        w.onclick = explodeWord;
        orbit.appendChild(w);
    }

}

/* --- Explosion + Counter Increment --- */
function explodeWord(e) {
    const el = e.target;
    clickCount++;


    // every 10 clicks -> enlarge orbit slightly
    if (clickCount % 10 === 0) enlargeOrbit();

    const randX = (Math.random() * 400 - 200) + "px";
    const randY = (Math.random() * 200 - 100) + "px";
    el.style.setProperty("--x", randX);
    el.style.setProperty("--y", randY);
    el.style.animation = "explode 0.9s forwards ease-out";
    el.onclick = null;

    setTimeout(() => {
        el.remove();
        const nw = document.createElement("span");
        nw.textContent = words[Math.floor(Math.random() * words.length)];
        nw.className = "orbit-word";
        nw.style.setProperty("--angle", `${Math.random() * 360}deg`);
        nw.style.color = colors[Math.floor(Math.random() * colors.length)];
        nw.onclick = explodeWord;
        orbit.appendChild(nw);
        positionWords(); // adjust distances for new radius
    }, 1000);
}

/* --- Enlarge Orbit --- */
function enlargeOrbit() {
    orbitScale += 0.005; // 0.5%
    orbit.style.transform = `scale(${orbitScale}) rotate(0deg)`; // maintain rotation
    positionWords();
}

/* --- Adjust Word Positions to Fit --- */
function positionWords() {
    const all = orbit.querySelectorAll(".orbit-word");
    all.forEach(w => {
        const angle = parseFloat(w.style.getPropertyValue("--angle")) || 0;
        const r = baseRadius * orbitScale;
        const rad = angle * (Math.PI / 180);
        const x = Math.cos(rad) * r;
        const y = Math.sin(rad) * r;
        w.style.transform = `translate(calc(50% + ${x}px - 50%), calc(50% + ${y}px - 50%)) rotate(${-angle}deg)`;
    });
}

/* --- Bubble Color Pulse Variation --- */
bubble.addEventListener("click", () => {
    const c = colors[Math.floor(Math.random() * colors.length)];

    // color pulse
    bubble.style.background = `radial-gradient(circle at 30% 30%, ${c}, #0a0a0a)`;
    bubble.style.boxShadow = `0 0 40px ${c}, inset 0 0 30px rgba(255,255,255,0.1)`;

    // vibration effect
    bubble.classList.remove("bubble-vibrate"); // reset if still active
    void bubble.offsetWidth;                   // reflow hack to restart animation
    bubble.classList.add("bubble-vibrate");
});


createWords();
