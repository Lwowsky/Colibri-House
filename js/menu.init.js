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

    let widthPx = 1;
    let basePx = 0;

    function point(e) {
      return e.touches ? e.touches[0] : e;
    }

    function setPxTransform(cur, xPx, ms = 0) {
      if (!cur?.carTrack) return;
      cur.carTrack.style.transition = ms ? `transform ${ms}ms ease` : "none";
      cur.carTrack.style.transform = `translate3d(${xPx}px,0,0)`;
    }

    function requireGoToDish() {
      return typeof S.goToDish === "function";
    }

    function backToPercent(animate) {
      // Повертаємо керування твоєму slider-методу
      if (!requireGoToDish()) return;
      S.goToDish(S.index, animate);
    }

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

      widthPx = cur.carViewport?.clientWidth || 1;
      basePx = -S.index * widthPx;

      // починаємо drag у px
      setPxTransform(cur, basePx, 0);
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
        setPxTransform(cur, basePx + dx, 0);
      }
    }

    function snapBack() {
      const cur = S.getModalEls?.();
      if (!cur?.carTrack) return;

      setPxTransform(cur, basePx, 180);
      cur.carTrack.addEventListener(
        "transitionend",
        () => backToPercent(false),
        { once: true },
      );
    }

    function swipeAndSwitch(dir) {
      const cur = S.getModalEls?.();
      if (!cur?.carTrack) return;

      if (!requireGoToDish()) return;

      S.isAnimating = true;

      const toPx = basePx - dir * widthPx;
      setPxTransform(cur, toPx, 180);

      cur.carTrack.addEventListener(
        "transitionend",
        () => {
          S.index = (S.index + dir + S.items.length) % S.items.length;

          // зафіксувати у “нормальному” режимі (твоє %)
          S.goToDish(S.index, false);

          requestAnimationFrame(() => {
            S.isAnimating = false;
          });
        },
        { once: true },
      );
    }

    function onEnd() {
      if (!active) return;
      active = false;

      // якщо вертикальний скрол — повертаємось назад
      if (lock !== "x") {
        backToPercent(true);
        return;
      }

      if (Math.abs(dx) >= S.THRESHOLD && S.items.length > 1) {
        swipeAndSwitch(dx < 0 ? 1 : -1);
      } else {
        snapBack();
      }
    }

    // важливо для iOS: passive:false на start/move
    els.carViewport.addEventListener("touchstart", onStart, { passive: false });
    els.carViewport.addEventListener("touchmove", onMove, { passive: false });
    els.carViewport.addEventListener("touchend", onEnd, { passive: true });
    els.carViewport.addEventListener("touchcancel", onEnd, { passive: true });

    // desktop drag
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

        if (typeof S.openDishByIndex === "function") {
          S.openDishByIndex(idx >= 0 ? idx : 0);
        }
      });
    }

    const els = S.getModalEls?.();
    if (els?.dishModal && els.dishModal.dataset.menuInited !== "1") {
      els.dishModal.dataset.menuInited = "1";

      els.dishClose?.addEventListener("click", () => S.closeDishModal?.());

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

      window.addEventListener("keydown", (e) => {
        const cur = S.getModalEls?.();
        if (!cur?.dishModal?.classList.contains("open")) return;

        if (e.key === "Escape") S.closeDishModal?.();
        if (e.key === "ArrowLeft") S.prevDish?.();
        if (e.key === "ArrowRight") S.nextDish?.();
      });

      initSwipeOnce(els);
    } else if (els) {
      initSwipeOnce(els);
    }
  }

  document.addEventListener("DOMContentLoaded", initMenuOnce);
  document.body.addEventListener("htmx:load", initMenuOnce);
})();