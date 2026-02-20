(() => {
  // ======================
  // YEAR RANGE
  // ======================
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
    if (heroTimer) return; // не стартуємо 2 рази

    heroTimer = setInterval(() => {
      const img = document.getElementById("heroPhoto");
      if (!img) return; // hero ще не підвантажився — просто пропускаємо

      i = (i + 1) % photos.length;
      img.src = photos[i];
    }, 5500);
  }

  // ======================
  // REVIEW BUTTON
  // ======================
  function initReviewBtn() {
    const btn = document.getElementById("openReview");
    if (!btn) return;
    if (btn.dataset.inited === "1") return;
    btn.dataset.inited = "1";

    btn.addEventListener("click", () => {
      window.open("ВАШ_GOOGLE_REVIEW_LINK", "_blank", "noopener,noreferrer");
    });
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

    // щоб не ініціалізувати двічі (бо htmx:load буде викликати init знову)
    if (wrap.dataset.inited === "1") return;
    wrap.dataset.inited = "1";

    const START = 17 * 60; // 17:00
    const END = 22 * 60;   // 22:00
    const STEP = 15;

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

    input.addEventListener("click", toggleOpen);
    toggle.addEventListener("click", toggleOpen);

    dropdown.addEventListener("click", (e) => {
      const opt = e.target.closest(".timeOption");
      if (!opt) return;

      const value = opt.dataset.value;
      input.value = value;
      hidden.value = value;

      dropdown.querySelectorAll(".timeOption").forEach((b) => b.classList.remove("isSelected"));
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
  }

  // ======================
  // HEADER OFFSET
  // ======================
  function setHeaderOffset() {
    const header = document.querySelector("header");
    const h = header ? header.getBoundingClientRect().height : 80;
    document.documentElement.style.setProperty("--headerOffset", h + 8 + "px");
  }

  // ======================
  // MAIL
  // ======================
  function initMail() {
    const openBtn = document.getElementById("openMail");
    const mailModal = document.getElementById("mailModal");
    const closeBtn = document.getElementById("closeMail");
    const cancelBtn = document.getElementById("cancelMail");
    const mailForm = document.getElementById("mailForm");
    const mailHint = document.getElementById("mailHint");

    // Якщо елементів ще нема — просто вихід
    if (!mailModal) return;

    // щоб не навішувати handlers по кілька разів
    if (mailModal.dataset.inited === "1") return;
    mailModal.dataset.inited = "1";

    function openMailModal() {
      mailModal.classList.add("open");
      mailModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }

    function closeMailModal() {
      mailModal.classList.remove("open");
      mailModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (mailHint) mailHint.style.display = "none";
    }

    openBtn?.addEventListener("click", openMailModal);
    closeBtn?.addEventListener("click", closeMailModal);
    cancelBtn?.addEventListener("click", closeMailModal);

    window.addEventListener("keydown", (e) => {
      if (!mailModal.classList.contains("open")) return;
      if (e.key === "Escape") closeMailModal();
    });

    mailForm?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.currentTarget;
      const action = form.getAttribute("action");
      if (!action) return;

      try {
        const res = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          form.reset();
          closeMailModal();

          const successModal = document.getElementById("successModal");
          if (successModal) {
            successModal.classList.add("open");
            successModal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
          }
          return;
        }

        if (mailHint) {
          mailHint.style.display = "block";
          mailHint.textContent =
            "Не вдалося надіслати. Спробуйте ще раз або використайте mailto.";
        }
      } catch {
        if (mailHint) {
          mailHint.style.display = "block";
          mailHint.textContent =
            "Помилка мережі. Спробуйте ще раз або використайте mailto.";
        }
      }
    });
  }

  // ======================
  // INIT (DOM + HTMX)
  // ======================
  function initAll() {
    updateYearRange();
    setHeaderOffset();

    // UI that may be loaded via htmx:
    initPrettyTimeSelect();
    initMail();
    initReviewBtn();

    // runs safely even before hero exists
    startHeroSliderOnce();
  }

  document.addEventListener("DOMContentLoaded", initAll);
  document.body.addEventListener("htmx:load", initAll);

  // resize offset
  window.addEventListener("resize", setHeaderOffset);
})();