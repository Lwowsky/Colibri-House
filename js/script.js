(() => {
  const el = document.getElementById("yearRange");
  if (!el) return;

  const start = Number(el.dataset.start) || new Date().getFullYear();
  const now = new Date().getFullYear();

  el.textContent = (start === now) ? `${now}` : `${start}–${now}`;
})();

const photos = [
  "img/hero/photo1.jpg",
  "img/hero/photo2.jpg",
  "img/hero/photo3.jpg",
  "img/hero/photo4.jpg",
  "img/hero/photo5.jpg",
  "img/hero/photo6.jpg",
  "img/hero/photo7.jpg",
  "img/hero/photo8.jpg",
  "img/hero/photo9.jpg",
  "img/hero/photo10.jpg",
  "img/hero/photo11.jpg",
  "img/hero/photo12.jpg",
  "img/hero/photo13.jpg",
];

let i = 0;
const img = document.getElementById("heroPhoto");

setInterval(() => {
  i = (i + 1) % photos.length;
  img.src = photos[i];
}, 5500);

// review button
document.getElementById("openReview")?.addEventListener("click", () => {
  window.open("ВАШ_GOOGLE_REVIEW_LINK", "_blank", "noopener,noreferrer");
});

// reserve time
(function initPrettyTimeSelect(){
  const wrap = document.getElementById("timeSelect");
  const input = document.getElementById("timeInput");
  const hidden = document.getElementById("timeHidden");
  const toggle = document.getElementById("timeToggle");
  const dropdown = document.getElementById("timeDropdown");

  if (!wrap || !input || !hidden || !toggle || !dropdown) return;

  const START = 17 * 60;  // 17:00
  const END = 22 * 60;    // 22:00
  const STEP = 15;        // <-- 15 хв (постав 30, якщо хочеш менше пунктів)

  const toHHMM = (m) => {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // build options
  dropdown.innerHTML = "";
  for (let m = START; m <= END; m += STEP) {
    const t = toHHMM(m);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "timeOption";
    btn.textContent = t;
    btn.dataset.value = t;
    dropdown.appendChild(btn);
  }

  const open = () => {
    wrap.classList.add("open");
    input.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    wrap.classList.remove("open");
    input.setAttribute("aria-expanded", "false");
  };

  const toggleOpen = () => (wrap.classList.contains("open") ? close() : open());

  // open/close handlers
  input.addEventListener("click", toggleOpen);
  toggle.addEventListener("click", toggleOpen);

  // select value
  dropdown.addEventListener("click", (e) => {
    const opt = e.target.closest(".timeOption");
    if (!opt) return;

    const value = opt.dataset.value;

    input.value = value;     // що бачить користувач
    hidden.value = value;    // що відправляється у Formspree

    dropdown.querySelectorAll(".timeOption").forEach(b => b.classList.remove("isSelected"));
    opt.classList.add("isSelected");

    close();
  });

  // close on outside click
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });

  // close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();
// header offset for anchor links
(function () {
  function setHeaderOffset() {
    const header = document.querySelector("header");
    const h = header ? header.offsetHeight : 80;
    document.documentElement.style.setProperty("--headerOffset", (h + 12) + "px");
  }

  window.addEventListener("load", setHeaderOffset);
  window.addEventListener("resize", setHeaderOffset);
})();
