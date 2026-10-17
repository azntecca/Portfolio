function updateTime() {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });

    const zone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
        .formatToParts(now)
        .find((p) => p.type === "timeZoneName").value;

    document.getElementById("timezone").textContent = zone;
    document.getElementById("time").textContent = time;
}

updateTime();
setInterval(updateTime, 1000);

// Animations: split the name into letters so each one can animate
const title = document.querySelector(".title");
const text = title.textContent;

title.setAttribute("aria-label", text);   // screen readers still read the full name
title.textContent = "";

[...text].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "letter";
    s.setAttribute("aria-hidden", "true");
    s.textContent = ch === " " ? "\u00A0" : ch;
    s.style.setProperty("--i", i);
    title.appendChild(s);
});

// keep the ruled lines lined up with the intro text
function alignLines() {
    const intro = document.querySelector(".intro");
    if (!intro) return;
    const top = intro.getBoundingClientRect().top + window.scrollY;
    document.body.style.setProperty("--line-shift", (((top % 32) + 32) % 32) + "px");
}

alignLines();
window.addEventListener("load", alignLines);
window.addEventListener("resize", alignLines);
if (document.fonts) document.fonts.ready.then(alignLines);

// ---------- whiteboard ----------
(() => {
    const canvas = document.getElementById("wb-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const swatches = [...document.querySelectorAll(".swatch")];
    const clearBtn = document.getElementById("wb-clear");

    let color = "#111111";
    let drawing = false;
    let last = null;

    // match the canvas pixels to its on-screen size (sharp on retina), keeping the drawing
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        if (canvas.width === Math.round(w * dpr) && canvas.height === Math.round(h * dpr)) return;

        const copy = document.createElement("canvas");
        copy.width = canvas.width;
        copy.height = canvas.height;
        if (canvas.width) copy.getContext("2d").drawImage(canvas, 0, 0);

        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (copy.width) ctx.drawImage(copy, 0, 0, w, h);
    }

    function pos(e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function stroke(from, to) {
        const erasing = color === "eraser";
        ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
        ctx.strokeStyle = erasing ? "#000" : color;
        ctx.lineWidth = erasing ? 22 : 3;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    canvas.addEventListener("pointerdown", (e) => {
        drawing = true;
        last = pos(e);
        canvas.setPointerCapture(e.pointerId);
        stroke(last, { x: last.x + 0.01, y: last.y });   // a tap leaves a dot
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const p = pos(e);
        stroke(last, p);
        last = p;
    });

    const stop = () => { drawing = false; };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);

    swatches.forEach((s) => {
        s.addEventListener("click", () => {
            swatches.forEach((x) => x.classList.remove("active"));
            s.classList.add("active");
            color = s.dataset.color;
        });
    });

    clearBtn.addEventListener("click", () => {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    });

    resize();
    window.addEventListener("resize", resize);
})();