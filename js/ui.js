(() => {
  const App = window.App;
  const I18n = window.AppI18n;
  if (!App || !I18n) return;

  const { $, $$, createToast } = App;
  const { detectLang, setLang, getDict } = I18n;

  let toast = null;
  let escBound = false;
  let scrollBound = false;
  let navObs = null;

  // ---------- Toast (lazy) ----------
  function ensureToast() {
    if (toast) return toast;
    const node = $("#toast");
    if (!node) return null;
    toast = createToast(node);
    return toast;
  }

  function showToast(msg) {
    const t = ensureToast();
    if (t) t.show(msg);
  }

  // ---------- Reservation Modal ----------
  function openReserveModal() {
    const modal = $("#modal");
    if (!modal) return;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const first = modal.querySelector("input, select, textarea, button");
    first?.focus();
  }

  function closeReserveModal() {
    const modal = $("#modal");
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // ---------- Success Modal ----------
  function openSuccessModal() {
    const successModal = $("#successModal");
    if (!successModal) return;

    successModal.classList.add("open");
    successModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    successModal.querySelector("button")?.focus();
  }

  function closeSuccessModal() {
    const successModal = $("#successModal");
    if (!successModal) return;

    successModal.classList.remove("open");
    successModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // ---------- Sheet ----------
  function openSheet() {
    const sheet = $("#sheet");
    const burger = $("#burger");
    if (!sheet) return;

    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    burger?.setAttribute("aria-expanded", "true");
  }

  function closeSheet() {
    const sheet = $("#sheet");
    const burger = $("#burger");
    if (!sheet) return;

    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    burger?.setAttribute("aria-expanded", "false");
  }

  // ---------- Sync hidden form language ----------
  function syncFormLang() {
    const lang = document.documentElement.lang || detectLang() || "uk";
    $("#formLang")?.setAttribute("value", lang);
  }

  // ---------- Form submit (Formspree) ----------
  function initReserveFormOnce() {
    const form = $("#reserveForm");
    if (!form) return;
    if (form.dataset.inited === "1") return;
    form.dataset.inited = "1";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const url = form.action;

      if (!url || url.includes("PASTE_YOUR_ID")) {
        showToast(
          getDict()?.toast_form_link_missing ||
            "Додай Formspree URL у form action",
        );
        return;
      }

      const gotcha = form.querySelector('input[name="_gotcha"]');
      if (gotcha && gotcha.value) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn?.setAttribute("disabled", "disabled");

      const timeHidden = form.querySelector("#timeHidden");
      if (!timeHidden?.value) {
        showToast("Оберіть час (17:00–22:00)");
        submitBtn?.removeAttribute("disabled");
        return;
      }

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });

        if (!res.ok) throw new Error("send_failed");

        form.reset();
        closeReserveModal();
        openSuccessModal();
      } catch {
        showToast(
          getDict()?.toast_failed || "Помилка відправки. Спробуйте ще раз.",
        );
      } finally {
        submitBtn?.removeAttribute("disabled");
      }
    });
  }

  // ---------- Copy buttons ----------
  function initCopyButtonsOnce() {
    $$("[data-copy]").forEach((btn) => {
      if (btn.dataset.inited === "1") return;
      btn.dataset.inited = "1";

      btn.addEventListener("click", async () => {
        const sel = btn.getAttribute("data-copy");
        const node = sel ? $(sel) : null;
        const text = node?.textContent?.trim();
        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);
          showToast(getDict()?.toast_copied || "Copied");
        } catch {
          showToast(getDict()?.toast_copy_failed || "Copy failed");
        }
      });
    });
  }

  // ---------- Active nav ----------
  function initActiveNavRebuild() {
    if (!("IntersectionObserver" in window)) return;

    const sections = ["menu", "about", "reserve", "access"]
      .map((id) => $("#" + id))
      .filter(Boolean);

    const navLinks = $$("#navLinks a");

    if (!sections.length || !navLinks.length) return;

    navObs?.disconnect();
    navObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + id),
          );
        });
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.01 },
    );

    sections.forEach((s) => navObs.observe(s));
  }

  // ---------- Back to top ----------
  function bindScrollOnce() {
    if (scrollBound) return;
    scrollBound = true;

    window.addEventListener(
      "scroll",
      () => {
        const toTop = $("#toTop");
        if (!toTop) return;
        toTop.classList.toggle("show", window.scrollY > 600);
      },
      { passive: true },
    );
  }

  function initToTopOnce() {
    const toTop = $("#toTop");
    if (!toTop) return;
    if (toTop.dataset.inited === "1") return;
    toTop.dataset.inited = "1";

    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );

    bindScrollOnce();
  }

  // ---------- Language buttons ----------
  function initLangButtonsOnce() {
    $$(".langbtn").forEach((b) => {
      if (b.dataset.inited === "1") return;
      b.dataset.inited = "1";

      b.addEventListener("click", () => {
        setLang(b.dataset.lang);
        setTimeout(syncFormLang, 0);
      });
    });

    setLang(detectLang());
    setTimeout(syncFormLang, 0);
  }

  // ---------- Modals + sheet listeners ----------
  function initUiListenersOnce() {
    ["openReserve", "openReserve2", "openReserve3"].forEach((id) => {
      const btn = $("#" + id);
      if (!btn) return;
      if (btn.dataset.inited === "1") return;
      btn.dataset.inited = "1";
      btn.addEventListener("click", openReserveModal);
    });

    ["closeModal", "cancelBtn"].forEach((id) => {
      const btn = $("#" + id);
      if (!btn) return;
      if (btn.dataset.inited === "1") return;
      btn.dataset.inited = "1";
      btn.addEventListener("click", closeReserveModal);
    });

    const modal = $("#modal");
    if (modal && modal.dataset.inited !== "1") {
      modal.dataset.inited = "1";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeReserveModal();
      });
    }

    ["closeSuccess", "okSuccess"].forEach((id) => {
      const btn = $("#" + id);
      if (!btn) return;
      if (btn.dataset.inited === "1") return;
      btn.dataset.inited = "1";
      btn.addEventListener("click", closeSuccessModal);
    });

    const successModal = $("#successModal");
    if (successModal && successModal.dataset.inited !== "1") {
      successModal.dataset.inited = "1";
      successModal.addEventListener("click", (e) => {
        if (e.target === successModal) closeSuccessModal();
      });
    }

    const burger = $("#burger");
    if (burger && burger.dataset.inited !== "1") {
      burger.dataset.inited = "1";
      burger.addEventListener("click", openSheet);
    }

    const closeSheetBtn = $("#closeSheet");
    if (closeSheetBtn && closeSheetBtn.dataset.inited !== "1") {
      closeSheetBtn.dataset.inited = "1";
      closeSheetBtn.addEventListener("click", closeSheet);
    }

    const sheet = $("#sheet");
    if (sheet && sheet.dataset.inited !== "1") {
      sheet.dataset.inited = "1";
      sheet.addEventListener("click", (e) => {
        if (e.target === sheet) closeSheet();
        if (e.target?.closest("a")) closeSheet();
      });
    }

    if (!escBound) {
      escBound = true;
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        closeReserveModal();
        closeSuccessModal();
        closeSheet();
      });
    }
  }

  // ---------- MAIN INIT ----------
  function initAll() {
    ensureToast();
    initUiListenersOnce(); // модалки/бургер
    initReserveFormOnce(); // form
    initCopyButtonsOnce(); // copy
    initActiveNavRebuild(); // nav observer
    initToTopOnce(); // back to top
    initLangButtonsOnce(); // language
  }

  document.addEventListener("DOMContentLoaded", initAll);
  document.body.addEventListener("htmx:load", initAll);
})();
