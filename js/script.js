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
  const setOffset = () => {
    const header = document.querySelector("header");
    const h = header ? header.getBoundingClientRect().height : 80;
    // +8px легкий запас, щоб заголовок не липнув до краю
    document.documentElement.style.setProperty("--headerOffset", (h + 8) + "px");
  };

  window.addEventListener("load", setOffset);
  window.addEventListener("resize", setOffset);
})();

// mail
(() => {
  const openBtn = document.getElementById("openMail");
  const mailModal = document.getElementById("mailModal");
  const closeBtn = document.getElementById("closeMail");
  const cancelBtn = document.getElementById("cancelMail");
  const mailForm = document.getElementById("mailForm");
  const mailHint = document.getElementById("mailHint");
  const mailToFallback = document.getElementById("mailToFallback");

  function openMailModal() {
    if (!mailModal) return;
    mailModal.classList.add("open");
    mailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeMailModal() {
    if (!mailModal) return;
    mailModal.classList.remove("open");
    mailModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    mailHint && (mailHint.style.display = "none");
  }

  openBtn?.addEventListener("click", openMailModal);
  closeBtn?.addEventListener("click", closeMailModal);
  cancelBtn?.addEventListener("click", closeMailModal);

  // ✅ Не закривати при кліку поза модалкою (як ти хотів раніше)
  // Якщо раптом у тебе є код, який закриває по кліку на backdrop — НЕ ставимо його тут.

  // Escape
  window.addEventListener("keydown", (e) => {
    if (!mailModal?.classList.contains("open")) return;
    if (e.key === "Escape") closeMailModal();
  });

  // Form submit (Formspree) — без перезавантаження
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

        // Якщо хочеш — показуй твій successModal
        const successModal = document.getElementById("successModal");
        if (successModal) {
          successModal.classList.add("open");
          successModal.setAttribute("aria-hidden", "false");
          document.body.classList.add("modal-open");
        }
        return;
      }

      mailHint.style.display = "block";
      mailHint.textContent = "Не вдалося надіслати. Спробуйте ще раз або використайте mailto.";
    } catch (err) {
      mailHint.style.display = "block";
      mailHint.textContent = "Помилка мережі. Спробуйте ще раз або використайте mailto.";
    }
  });

  // Fallback mailto (заповнимо тему+тіло з полів)
  mailToFallback?.addEventListener("click", () => {
    const data = new FormData(mailForm);
    const name = (data.get("name") || "").toString();
    const email = (data.get("email") || "").toString();
    const subject = (data.get("subject") || "").toString();
    const message = (data.get("message") || "").toString();

    const to = "colibrihouse.yokohama@gmail.com"; // <-- заміни на свій
    const body =
      `Name: ${name}\nEmail: ${email}\n\n` +
      `${message}`;

    const url =
      `mailto:${encodeURIComponent(to)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = url;
  });
})();
