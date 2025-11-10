/* --- Parallax bridge background --- */
const bg = document.querySelector('.bridge-bg');
document.addEventListener('mousemove', e => {
    if (!bg) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    bg.style.transform = `translate(${x}px, ${y}px)`;
});

/* --- Flying data boxes layer --- */
const dataLayer = document.getElementById('data-layer');

function createBox() {
    const div = document.createElement('div');
    div.className = 'data-box';
    const y = Math.random() * window.innerHeight + 'px';
    const duration = 10 + Math.random() * 10; // 10–20 s
    const delay = Math.random() * 8;          // random stagger
    div.style.setProperty('--y', y);
    div.style.animationDuration = `${duration}s`;
    div.style.animationDelay = `${delay}s`;
    dataLayer.appendChild(div);

    // remove after animation loop completes
    setTimeout(() => dataLayer.removeChild(div), (duration + delay) * 1000);
}

// Continuous generation
setInterval(createBox, 800);
for (let i = 0; i < 8; i++) createBox(); // initial
