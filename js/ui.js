(function(){
  const { $, $$, createToast } = window.App;
  const { detectLang, setLang, getDict } = window.AppI18n;

  const toast = createToast($("#toast"));

  const modal = $("#modal");
  const sheet = $("#sheet");
  const toTop = $("#toTop");
  const burger = $("#burger");

  // ---------- Modal ----------
  function openModal(){
    modal?.classList.add("open");
    modal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const first = modal?.querySelector("input, select, textarea, button");
    first?.focus();
  }
  function closeModal(){
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

  // ---------- Sheet ----------
  function openSheet(){
    sheet?.classList.add("open");
    sheet?.setAttribute("aria-hidden", "false");
    burger?.setAttribute("aria-expanded", "true");
  }
  function closeSheet(){
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
      closeSheet();
    }
  });

  // ---------- Form submit ----------
  $("#reserveForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    closeModal();
    toast.show(getDict()?.toast_ok || "OK");
  });

  // ---------- Copy buttons ----------
  $$("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const sel = btn.getAttribute("data-copy");
      const node = sel ? $(sel) : null;
      const text = node?.textContent?.trim();
      if (!text) return;

      try{
        await navigator.clipboard.writeText(text);
        toast.show(getDict()?.toast_copied || "Copied");
      }catch{
        toast.show(getDict()?.toast_copy_failed || "Copy failed");
      }
    });
  });

  // ---------- Active nav ----------
  (function initActiveNav(){
    const sections = ["menu","about","reserve","access"].map(id => $("#"+id)).filter(Boolean);
    const navLinks = $$("#navLinks a");
    if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#"+id));
      });
    }, { rootMargin: "-120px 0px -60% 0px", threshold: 0.01 });

    sections.forEach(s => obs.observe(s));
  })();

  // ---------- Back to top ----------
  (function initToTop(){
    if (!toTop) return;

    window.addEventListener("scroll", () => {
      toTop.classList.toggle("show", window.scrollY > 600);
    }, { passive:true });

    toTop.addEventListener("click", () => window.scrollTo({ top:0, behavior:"smooth" }));
  })();

  // ---------- Language + init ----------
  $$(".langbtn").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
  setLang(detectLang());
})();
