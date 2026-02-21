(() => {
  const S = window.MenuModal;
  if (!S) return;

  function initSwipeOnce(els) {
    if (!els?.carViewport || !els?.carTrack) return;
    if (els.carViewport.dataset.swipeInited === "1") return;
    els.carViewport.dataset.swipeInited = "1";

    let startX = 0,
      startY = 0,
      dx = 0,
      dy = 0,
      active = false,
      lock = null;

    // ✅ базова позиція треку (в %) для поточного S.index
    let basePct = 0;

    const point = (e) => (e.touches ? e.touches[0] : e);

    const getWidth = () => els.carViewport.getBoundingClientRect().width || 1;

    function onStart(e) {
      const cur = S.getModalEls?.();
      if (!cur?.dishModal?.classList.contains("open")) return;
      if (S.isAnimating) return;
      if (e.target.closest(".carBtn")) return;

      const p = point(e);
      active = true;
      lock = null;
      dx = dy = 0;

      startX = p.clientX;
      startY = p.clientY;

      // ✅ ВАЖЛИВО: у тебе немає trackIndex — беремо S.index
      const idx = Number.isFinite(S.index) ? S.index : 0;
      basePct = -idx * 100;

      cur.carTrack.style.transition = "none";
    }

    function onMove(e) {
      if (!active) return;

      const cur = S.getModalEls?.();
      if (!cur?.carTrack) return;

      const p = point(e);
      dx = p.clientX - startX;
      dy = p.clientY - startY;

      if (lock === null) {
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        if (ax > 8 || ay > 8) lock = ax > ay ? "x" : "y";
      }

      if (lock === "x") {
        if (e.cancelable) e.preventDefault();

        const w = getWidth();
        const deltaPct = (dx / w) * 100;

        // ✅ рухаємо від базового зсуву, а не від 0
        cur.carTrack.style.transform = `translate3d(${basePct + deltaPct}%, 0, 0)`;
      }
    }

    function snapBack() {
      const cur = S.getModalEls?.();
      if (!cur?.carTrack) return;

      cur.carTrack.style.transition = "transform 180ms ease";
      cur.carTrack.style.transform = `translate3d(${basePct}%, 0, 0)`;
    }

    function onEnd() {
      if (!active) return;
      active = false;

      const cur = S.getModalEls?.();
      if (!cur?.carTrack) return;

      if (lock !== "x") {
        // повертаємо трек в правильну позицію
        cur.carTrack.style.transition = `transform ${S.ANIM_MS}ms ease`;
        cur.carTrack.style.transform = `translate3d(${basePct}%, 0, 0)`;
        return;
      }

      const thresholdPx = Number.isFinite(S.THRESHOLD) ? S.THRESHOLD : 70;

      if (Math.abs(dx) >= thresholdPx && S.items.length > 1) {
        const dir = dx < 0 ? 1 : -1;
        // ✅ у тебе логіка на S.index
        S.goToDish?.(S.index + dir, true);
      } else {
        snapBack();
      }
    }

    // touch
    els.carViewport.addEventListener("touchstart", onStart, { passive: true });
    els.carViewport.addEventListener("touchmove", onMove, { passive: false });
    els.carViewport.addEventListener("touchend", onEnd, { passive: true });
    els.carViewport.addEventListener("touchcancel", onEnd, { passive: true });

    // mouse
    els.carViewport.addEventListener("mousedown", (e) => {
      onStart(e);
      const mm = (ev) => onMove(ev);
      const mu = () => {
        document.removeEventListener("mousemove", mm);
        document.removeEventListener("mouseup", mu);
        onEnd();
      };
      document.addEventListener("mousemove", mm);
      document.addEventListener("mouseup", mu);
    });
  }

  function initMenuOnce() {
    const menuGrid = S.getMenuGrid?.();
    if (menuGrid && menuGrid.dataset.menuInited !== "1") {
      menuGrid.dataset.menuInited = "1";
      menuGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".menuCard");
        if (!card) return;

        S.collectVisibleItems?.();

        const t = card.dataset.title || "";
        const p = card.dataset.price || "";
        const idx = S.items.findIndex((x) => x.title === t && x.price === p);

        S.openDishByIndex?.(idx >= 0 ? idx : 0);
      });
    }

    const els = S.getModalEls?.();
    if (els?.dishModal && els.dishModal.dataset.menuInited !== "1") {
      els.dishModal.dataset.menuInited = "1";

      els.dishClose?.addEventListener("click", S.closeDishModal);

      els.carPrev?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        S.prevDish?.();
      });

      els.carNext?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        S.nextDish?.();
      });

      // ✅ щоб не додавати keydown багато разів після htmx swap
      if (document.body.dataset.menuKeyBound !== "1") {
        document.body.dataset.menuKeyBound = "1";
        window.addEventListener("keydown", (e) => {
          const cur = S.getModalEls?.();
          if (!cur?.dishModal?.classList.contains("open")) return;

          if (e.key === "Escape") S.closeDishModal?.();
          if (e.key === "ArrowLeft") S.prevDish?.();
          if (e.key === "ArrowRight") S.nextDish?.();
        });
      }

      initSwipeOnce(els);
    } else if (els) {
      initSwipeOnce(els);
    }
  }

  // ✅ важливо: запускаємо одразу (на випадок, якщо htmx:load вже був)
  if (document.readyState !== "loading") initMenuOnce();
  else document.addEventListener("DOMContentLoaded", initMenuOnce);

  document.body.addEventListener("htmx:load", initMenuOnce);
})();