(function () {
  const { $, $$, createToast } = window.App;
  const { detectLang, setLang, getDict } = window.AppI18n;

  const toast = createToast($("#toast"));

  const modal = $("#modal");
  const successModal = $("#successModal");
  const sheet = $("#sheet");
  const toTop = $("#toTop");
  const burger = $("#burger");

  // ---------- Reservation Modal ----------
  function openModal() {
    modal?.classList.add("open");
    modal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const first = modal?.querySelector("input, select, textarea, button");
    first?.focus();
  }

  function closeModal() {
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  $("#openReserve")?.addEventListener("click", openModal);
  $("#openReserve2")?.addEventListener("click", openModal);
  $("#openReserve3")?.addEventListener("click", openModal);
  $("#closeModal")?.addEventListener("click", closeModal);
  $("#cancelBtn")?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ---------- Success Modal ----------
  function openSuccessModal() {
    successModal?.classList.add("open");
    successModal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const first = successModal?.querySelector("button");
    first?.focus();
  }

  function closeSuccessModal() {
    successModal?.classList.remove("open");
    successModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  $("#closeSuccess")?.addEventListener("click", closeSuccessModal);
  $("#okSuccess")?.addEventListener("click", closeSuccessModal);

  successModal?.addEventListener("click", (e) => {
    if (e.target === successModal) closeSuccessModal();
  });

  // ---------- Sheet ----------
  function openSheet() {
    sheet?.classList.add("open");
    sheet?.setAttribute("aria-hidden", "false");
    burger?.setAttribute("aria-expanded", "true");
  }

  function closeSheet() {
    sheet?.classList.remove("open");
    sheet?.setAttribute("aria-hidden", "true");
    burger?.setAttribute("aria-expanded", "false");
  }

  burger?.addEventListener("click", openSheet);
  $("#closeSheet")?.addEventListener("click", closeSheet);

  sheet?.addEventListener("click", (e) => {
    if (e.target === sheet) closeSheet();
    if (e.target?.closest("a")) closeSheet();
  });

  // ---------- Escape ----------
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeSuccessModal();
      closeSheet();
    }
  });

  // ---------- Sync hidden form language ----------
  function syncFormLang() {
    const lang = document.documentElement.lang || detectLang() || "uk";
    $("#formLang")?.setAttribute("value", lang);
  }

  // ---------- Form submit (Formspree) ----------
  $("#reserveForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const url = form.action;

    // If endpoint not set
    if (!url || url.includes("PASTE_YOUR_ID")) {
      toast.show(
        getDict()?.toast_form_link_missing || "Додай Formspree URL у form action"
      );
      return;
    }

    // Ignore bots filling honeypot
    const gotcha = form.querySelector('input[name="_gotcha"]');
    if (gotcha && gotcha.value) return;

    // Disable submit button while sending
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn?.setAttribute("disabled", "disabled");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (!res.ok) throw new Error("send_failed");

      form.reset();
      closeModal();
      openSuccessModal(); // ✅ show delivered modal

      // (optional) auto close after 2.5s:
      // setTimeout(closeSuccessModal, 2500);
    } catch (err) {
      toast.show(getDict()?.toast_failed || "Помилка відправки. Спробуйте ще раз.");
    } finally {
      submitBtn?.removeAttribute("disabled");
    }
  });

  // ---------- Copy buttons ----------
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sel = btn.getAttribute("data-copy");
      const node = sel ? $(sel) : null;
      const text = node?.textContent?.trim();
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        toast.show(getDict()?.toast_copied || "Copied");
      } catch {
        toast.show(getDict()?.toast_copy_failed || "Copy failed");
      }
    });
  });

  // ---------- Active nav ----------
  (function initActiveNav() {
    const sections = ["menu", "about", "reserve", "access"]
      .map((id) => $("#" + id))
      .filter(Boolean);

    const navLinks = $$("#navLinks a");
    if (!sections.length || !navLinks.length || !("IntersectionObserver" in window))
      return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + id)
          );
        });
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.01 }
    );

    sections.forEach((s) => obs.observe(s));
  })();

  // ---------- Back to top ----------
  (function initToTop() {
    if (!toTop) return;

    window.addEventListener(
      "scroll",
      () => {
        toTop.classList.toggle("show", window.scrollY > 600);
      },
      { passive: true }
    );

    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  })();

  // ---------- Language + init ----------
  $$(".langbtn").forEach((b) =>
    b.addEventListener("click", () => {
      setLang(b.dataset.lang);
      setTimeout(syncFormLang, 0);
    })
  );

  setLang(detectLang());
  setTimeout(syncFormLang, 0);
})();
