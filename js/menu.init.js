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

    function point(e) {
      return e.touches ? e.touches[0] : e;
    }

    function onStart(e) {
      const cur = S.getModalEls();
      if (!cur?.dishModal?.classList.contains("open")) return;
      if (S.isAnimating) return;
      if (e.target.closest(".carBtn")) return;

      const p = point(e);
      active = true;
      lock = null;
      dx = dy = 0;
      startX = p.clientX;
      startY = p.clientY;

      cur.carTrack.style.transition = "none";
    }

    function onMove(e) {
      if (!active) return;

      const cur = S.getModalEls();
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
        cur.carTrack.style.transform = `translate3d(${dx}px, 0, 0)`;
      }
    }

    function snapBack() {
      const cur = S.getModalEls();
      if (!cur?.carTrack) return;

      cur.carTrack.style.transition = `transform 180ms ease`;
      cur.carTrack.style.transform = "translate3d(0,0,0)";
    }

    function swipeAndSwitch(dir) {
      const cur = S.getModalEls();
      if (!cur?.carTrack) return;

      S.isAnimating = true;

      cur.carTrack.style.transition = `transform 180ms ease`;
      cur.carTrack.style.transform =
        dir === 1 ? "translate3d(-100%,0,0)" : "translate3d(100%,0,0)";

      cur.carTrack.addEventListener(
        "transitionend",
        () => {
          S.index = (S.index + dir + S.items.length) % S.items.length;

          const els2 = S.getModalEls();
          if (els2) {
            S.goToDish(S.index, false);
          }

          requestAnimationFrame(() => {
            if (els2?.carTrack)
              els2.carTrack.style.transition = `transform ${S.ANIM_MS}ms ease`;
            S.isAnimating = false;
          });
        },
        { once: true },
      );
    }

    function onEnd() {
      if (!active) return;
      active = false;

      const cur = S.getModalEls();
      if (!cur?.carTrack) return;

      if (lock !== "x") {
        cur.carTrack.style.transition = `transform ${S.ANIM_MS}ms ease`;
        cur.carTrack.style.transform = `translate3d(${-S.index * 100}%,0,0)`;
        return;
      }

      if (Math.abs(dx) >= S.THRESHOLD && S.items.length > 1) {
        swipeAndSwitch(dx < 0 ? 1 : -1);
      } else {
        snapBack();
      }
    }

    els.carViewport.addEventListener("touchstart", onStart, { passive: true });
    els.carViewport.addEventListener("touchmove", onMove, { passive: false });
    els.carViewport.addEventListener("touchend", onEnd, { passive: true });
    els.carViewport.addEventListener("touchcancel", onEnd, { passive: true });

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
    const menuGrid = S.getMenuGrid();
    if (menuGrid && menuGrid.dataset.menuInited !== "1") {
      menuGrid.dataset.menuInited = "1";

      menuGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".menuCard");
        if (!card) return;

        S.collectVisibleItems();

        const t = card.dataset.title || "";
        const p = card.dataset.price || "";
        const idx = S.items.findIndex((x) => x.title === t && x.price === p);

        S.openDishByIndex(idx >= 0 ? idx : 0);
      });
    }

    const els = S.getModalEls();
    if (els?.dishModal && els.dishModal.dataset.menuInited !== "1") {
      els.dishModal.dataset.menuInited = "1";

      els.dishClose?.addEventListener("click", S.closeDishModal);

      els.carPrev?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        S.prevDish();
      });

      els.carNext?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        S.nextDish();
      });

      window.addEventListener("keydown", (e) => {
        const cur = S.getModalEls();
        if (!cur?.dishModal?.classList.contains("open")) return;

        if (e.key === "Escape") S.closeDishModal();
        if (e.key === "ArrowLeft") S.prevDish();
        if (e.key === "ArrowRight") S.nextDish();
      });

      initSwipeOnce(els);
    } else if (els) {
      initSwipeOnce(els);
    }
  }

  document.addEventListener("DOMContentLoaded", initMenuOnce);
  document.body.addEventListener("htmx:load", initMenuOnce);
})();
