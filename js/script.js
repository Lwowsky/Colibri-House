(() => {
  function updateYearRange() {
    const el = document.getElementById("yearRange");
    if (!el) return;

    const start = Number(el.dataset.start) || new Date().getFullYear();
    const now = new Date().getFullYear();
    el.textContent = start === now ? `${now}` : `${start}–${now}`;
  }

  // ======================
  // HERO PHOTO SLIDER
  // ======================
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
  let heroTimer = null;

  function startHeroSliderOnce() {
    if (heroTimer) return;

    heroTimer = setInterval(() => {
      const img = document.getElementById("heroPhoto");
      if (!img) return;

      i = (i + 1) % photos.length;
      img.src = photos[i];
    }, 5500);
  }

  // ======================
  // RESERVE TIME SELECT
  // ======================
  function initPrettyTimeSelect() {
    const wrap = document.getElementById("timeSelect");
    const input = document.getElementById("timeInput");
    const hidden = document.getElementById("timeHidden");
    const toggle = document.getElementById("timeToggle");
    const dropdown = document.getElementById("timeDropdown");

    if (!wrap || !input || !hidden || !toggle || !dropdown) return;
    if (wrap.dataset.inited === "1") return;
    wrap.dataset.inited = "1";

    const START = 17 * 60; // 17:00
    const END = 22 * 60; // 22:00
    const STEP = 15;

    const toHHMM = (m) => {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      return `${hh}:${mm}`;
    };

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

    const toggleOpen = () =>
      wrap.classList.contains("open") ? close() : open();

    input.addEventListener("click", toggleOpen);
    toggle.addEventListener("click", toggleOpen);

    dropdown.addEventListener("click", (e) => {
      const opt = e.target.closest(".timeOption");
      if (!opt) return;

      const value = opt.dataset.value;
      input.value = value;
      hidden.value = value;

      dropdown
        .querySelectorAll(".timeOption")
        .forEach((b) => b.classList.remove("isSelected"));
      opt.classList.add("isSelected");

      close();
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // ======================
  // HEADER OFFSET
  // ======================
  function setHeaderOffset() {
    const header = document.querySelector("header");
    const h = header ? header.getBoundingClientRect().height : 80;
    document.documentElement.style.setProperty("--headerOffset", h + 8 + "px");
  }

  function initAll() {
    updateYearRange();
    setHeaderOffset();
    initPrettyTimeSelect();
    startHeroSliderOnce();
  }

  document.addEventListener("DOMContentLoaded", initAll);
  document.body.addEventListener("htmx:load", initAll);
  window.addEventListener("resize", setHeaderOffset);
})();
