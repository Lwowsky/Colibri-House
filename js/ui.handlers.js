(() => {
  const App = window.App;
  const I18n = window.AppI18n;
  if (!App || !I18n) return;

  const { $, $$, createToast } = App;
  const { getDict } = I18n;

  let toast = null;
  let escBound = false;
  let scrollBound = false;
  let navObs = null;

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

  function openBackdrop(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    return true;
  }

  function closeBackdrop(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function openReserveModal() {
    if (!openBackdrop("modal")) return;
    $("#modal")?.querySelector("input, select, textarea, button")?.focus();
  }
  function closeReserveModal() {
    closeBackdrop("modal");
  }

  function openMailModal() {
    if (!openBackdrop("mailModal")) return;
    $("#mailModal")?.querySelector("input, textarea, button")?.focus();
  }
  function closeMailModal() {
    closeBackdrop("mailModal");
    const mailHint = $("#mailHint");
    if (mailHint) mailHint.style.display = "none";
  }

  function openSuccessModal() {
    if (!openBackdrop("successModal")) return;
    $("#successModal")?.querySelector("button")?.focus();
  }
  function closeSuccessModal() {
    closeBackdrop("successModal");
  }

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
    if (modal && modal.dataset.backdropInited !== "1") {
      modal.dataset.backdropInited = "1";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeReserveModal();
      });
    }

    ["openMail", "openMailSheet"].forEach((id) => {
      const btn = $("#" + id);
      if (!btn) return;
      if (btn.dataset.inited === "1") return;
      btn.dataset.inited = "1";
      btn.addEventListener("click", openMailModal);
    });

    ["closeMail", "cancelMail"].forEach((id) => {
      const btn = $("#" + id);
      if (!btn) return;
      if (btn.dataset.inited === "1") return;
      btn.dataset.inited = "1";
      btn.addEventListener("click", closeMailModal);
    });

    const mailModal = $("#mailModal");
    if (mailModal && mailModal.dataset.backdropInited !== "1") {
      mailModal.dataset.backdropInited = "1";
      mailModal.addEventListener("click", (e) => {
        if (e.target === mailModal) closeMailModal();
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
    if (successModal && successModal.dataset.backdropInited !== "1") {
      successModal.dataset.backdropInited = "1";
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
        closeMailModal();
        closeSuccessModal();
        closeSheet();
      });
    }
  }

  document.addEventListener("app:reserve-sent", () => {
    closeReserveModal();
    openSuccessModal();
  });

  document.addEventListener("app:mail-sent", () => {
    closeMailModal();
    openSuccessModal();
  });

  function initAll() {
    ensureToast();
    initUiListenersOnce();
    initCopyButtonsOnce();
    initActiveNavRebuild();
    initToTopOnce();
  }

  document.addEventListener("DOMContentLoaded", initAll);
  document.body.addEventListener("htmx:load", initAll);
})();
