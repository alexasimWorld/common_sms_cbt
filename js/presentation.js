// ===========================================================
//   Company CBT Presentation Viewer
//   Works with structured allchapters_wrapped_final.html
// ===========================================================



function loadHTMLPresentation() {
    const chapterDiv = document.getElementById("chapter-content");
    const titleSpan = document.getElementById("chapter-title");
    if (!chapterDiv || !titleSpan) return;

    // Detect correct path
    let basePath = window.location.origin || "";
    if (basePath === "null" || basePath.startsWith("file")) basePath = "";
    const htmlPath = `${basePath}/presentation/allchapters_wrapped_final.html`;

    console.log("📘 Loading structured presentation:", htmlPath);

    fetch(htmlPath)
        .then(res => res.ok ? res.text() : Promise.reject("Could not load allchapters_wrapped_final.html"))
        .then(html => {
            const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            const cleanedHTML = match ? match[1] : html;

            const temp = document.createElement("div");
            temp.innerHTML = cleanedHTML;

            // Find all structured chapter blocks
            const chapters = Array.from(temp.querySelectorAll(".chapter"));
            if (!chapters.length) {
                console.warn("⚠️ No .chapter sections found.");
                chapterDiv.innerHTML = cleanedHTML;
                return;
            }

            // Inject into page
            chapterDiv.innerHTML = "";
            chapters.forEach(ch => chapterDiv.appendChild(ch));

            // Fade in
            chapterDiv.style.opacity = 0;
            setTimeout(() => {
                chapterDiv.style.transition = "opacity 0.6s ease";
                chapterDiv.style.opacity = 1;
            }, 50);

            titleSpan.textContent = "Company CBT Presentation";
            console.log(`✅ Loaded ${chapters.length} chapters successfully.`);
            setTimeout(initChapterEffects, 300);
        })
        .catch(err => {
            console.error("❌ Error:", err);
            chapterDiv.innerHTML = `<p style="color:red;">${err}</p>`;
        });
}

window.addEventListener("DOMContentLoaded", loadHTMLPresentation);


// -----------------------------------------------------------
//   Floating Chapter Label + Overlay Highlight System
// -----------------------------------------------------------
function initChapterEffects() {
    const scrollArea = document.querySelector(".presentation-container");
    if (!scrollArea) return;

    const floatBox = document.getElementById("chapter-float");
    const overlay = document.getElementById("chapter-transition");
    const boxes = Array.from(document.querySelectorAll(".chapter"));

    window._lastChapter = "";

    scrollArea.addEventListener("scroll", () => {
        let activeBox = null;
        const areaRect = scrollArea.getBoundingClientRect();

        boxes.forEach(box => {
            const rect = box.getBoundingClientRect();
            if (rect.top < areaRect.top + areaRect.height / 2) {
                activeBox = box;
            }
        });

        if (activeBox) {
            const header = activeBox.querySelector("h1, h2, h3");
            const title = header ? header.textContent.trim() : "Untitled Chapter";

            floatBox.textContent = title;
            floatBox.classList.add("visible");

            boxes.forEach(b => b.classList.remove("active-box"));
            activeBox.classList.add("active-box");

            if (title !== window._lastChapter) {
                window._lastChapter = title;
                overlay.textContent = title;
                overlay.classList.add("active");
                setTimeout(() => overlay.classList.remove("active"), 1200);
            }
        }
    });
}
