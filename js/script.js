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

  // ======================
  // HONEYPOT HELPERS
  // ======================
  function isHoneypotTripped(form) {
    const gotcha = form?.querySelector('input[name="_gotcha"]');
    return !!(gotcha && gotcha.value && gotcha.value.trim() !== "");
  }

  // ======================
  // SUCCESS MODAL (shared)
  // ======================
  function openSuccessModal() {
    const successModal = document.getElementById("successModal");
    if (!successModal) return;

    successModal.classList.add("open");
    successModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  // ======================
  // RESERVE MODAL (optional submit via fetch)
  // ======================
  function closeReserveModal() {
    const modal = document.getElementById("modal");
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function initReserveOnce() {
    const reserveForm = document.getElementById("reserveForm");
    if (!reserveForm) return;

    if (reserveForm.dataset.inited === "1") return;
    reserveForm.dataset.inited = "1";

    reserveForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.currentTarget;
      const action = form.getAttribute("action");
      if (!action) return;

      // Honeypot (anti-spam)
      if (isHoneypotTripped(form)) return;

      try {
        const res = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          form.reset();
          closeReserveModal();
          openSuccessModal();
          return;
        }

        // якщо хочеш — можу додати reserveHint як у mail
        alert("Не вдалося надіслати бронювання. Спробуйте ще раз.");
      } catch {
        alert("Помилка мережі. Спробуйте ще раз.");
      }
    });
  }

  // ======================
  // MAIL (HTMX-SAFE)
  // ======================
  let mailOpenPending = false;

  function openMailModal() {
    const mailModal = document.getElementById("mailModal");
    if (!mailModal) return false;

    mailModal.classList.add("open");
    mailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    return true;
  }

  function closeMailModal() {
    const mailModal = document.getElementById("mailModal");
    if (!mailModal) return;

    mailModal.classList.remove("open");
    mailModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    const mailHint = document.getElementById("mailHint");
    if (mailHint) mailHint.style.display = "none";
  }

  function bindMailOpenOnce() {
    if (document.body.dataset.mailOpenBound === "1") return;
    document.body.dataset.mailOpenBound = "1";

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("#openMail, #openMailSheet");
      if (!trigger) return;

      if (openMailModal()) return;
      mailOpenPending = true;
    });
  }

  function bindMailPendingOnHtmxOnce() {
    if (document.body.dataset.mailPendingBound === "1") return;
    document.body.dataset.mailPendingBound = "1";

    document.body.addEventListener("htmx:load", () => {
      if (!mailOpenPending) return;
      if (openMailModal()) mailOpenPending = false;
    });
  }

  function initMailOnce() {
    const mailModal = document.getElementById("mailModal");
    if (!mailModal) return;

    if (mailModal.dataset.inited === "1") return;
    mailModal.dataset.inited = "1";

    const closeBtn = document.getElementById("closeMail");
    const cancelBtn = document.getElementById("cancelMail");
    const mailForm = document.getElementById("mailForm");
    const mailHint = document.getElementById("mailHint");

    closeBtn?.addEventListener("click", closeMailModal);
    cancelBtn?.addEventListener("click", closeMailModal);

    window.addEventListener("keydown", (e) => {
      const mm = document.getElementById("mailModal");
      if (!mm?.classList.contains("open")) return;
      if (e.key === "Escape") closeMailModal();
    });

    // Form submit (Formspree) — без перезавантаження
    mailForm?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.currentTarget;
      const action = form.getAttribute("action");
      if (!action) return;

      // Honeypot (anti-spam)
      if (isHoneypotTripped(form)) return;

      try {
        const res = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          form.reset();
          closeMailModal();
          openSuccessModal();
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

    initPrettyTimeSelect();
    initReserveOnce();

    bindMailOpenOnce();
    bindMailPendingOnHtmxOnce();
    initMailOnce();

    startHeroSliderOnce();
  }

  document.addEventListener("DOMContentLoaded", initAll);
  document.body.addEventListener("htmx:load", initAll);
  window.addEventListener("resize", setHeaderOffset);
})();