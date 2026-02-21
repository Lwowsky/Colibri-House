(() => {
  let modalItems = [];
  let modalIndex = 0;
  let built = false;
  let isAnimating = false;

  const ANIM_MS = 280;
  const THRESHOLD = 70;

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  function getMenuGrid() {
    return document.getElementById("menuGrid");
  }

  function getModalEls() {
    const dishModal = document.getElementById("dishModal");
    if (!dishModal) return null;

    return {
      dishModal,
      dishClose: document.getElementById("dishClose"),
      dishTitle: document.getElementById("dishTitle"),
      dishDesc: document.getElementById("dishDesc"),
      dishTag: document.getElementById("dishTag"),
      dishPrice: document.getElementById("dishPrice"),

      carTrack: document.getElementById("carTrack"),
      carDots: document.getElementById("carDots"),
      carPrev: document.getElementById("carPrev"),
      carNext: document.getElementById("carNext"),

      carViewport: dishModal.querySelector(".carViewport"),
    };
  }

  function collectVisibleItems() {
    const menuGrid = getMenuGrid();
    if (!menuGrid) return;

    const cards = [...menuGrid.querySelectorAll(".menuCard")];

    modalItems = cards.map((card) => {
      let imgs = [];
      try {
        imgs = JSON.parse(card.dataset.imgs || "[]");
      } catch {
        imgs = [];
      }

      const cover =
        (Array.isArray(imgs) && imgs.length ? imgs[0] : null) ||
        card.dataset.img ||
        "";

      return {
        title: card.dataset.title || "",
        desc: card.dataset.desc || "",
        price: card.dataset.price || "",
        tag: card.dataset.tag || "",
        cover,
      };
    });

    built = false;
  }

  function buildSlidesOnce(els) {
    if (built) return;
    built = true;

    if (!els?.carTrack || !els?.carDots) return;

    els.carTrack.innerHTML = "";
    els.carDots.innerHTML = "";

    if (!modalItems.length) {
      els.carTrack.innerHTML = `<div class="carSlide placeholder"></div>`;
      return;
    }

    modalItems.forEach((it) => {
      const slide = document.createElement("div");
      slide.className = "carSlide";
      slide.innerHTML = it.cover
        ? `<img src="${esc(it.cover)}" alt="${esc(it.title)}" loading="eager" decoding="async" draggable="false">`
        : `<div class="carSlide placeholder"></div>`;
      els.carTrack.appendChild(slide);
    });

    const many = modalItems.length > 1;
    if (els.carPrev) els.carPrev.style.display = many ? "grid" : "none";
    if (els.carNext) els.carNext.style.display = many ? "grid" : "none";
    if (els.carDots) els.carDots.style.display = many ? "flex" : "none";

    if (many) {
      modalItems.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carDot";
        dot.addEventListener("click", () => goToDish(i, true));
        els.carDots.appendChild(dot);
      });
    }
  }

  function updateText(i, els) {
    const item = modalItems[i];
    if (!item || !els) return;

    if (els.dishTitle) els.dishTitle.textContent = item.title || "";
    if (els.dishDesc) els.dishDesc.textContent = item.desc || "";
    if (els.dishTag) els.dishTag.textContent = item.tag || "";
    if (els.dishPrice) els.dishPrice.textContent = item.price || "";
  }

  function updateDots(els) {
    if (!els?.carDots) return;
    const dots = [...els.carDots.querySelectorAll(".carDot")];
    dots.forEach((d, i) => d.classList.toggle("isActive", i === modalIndex));
  }

  function setTransformIndex(i, animate, els) {
    if (!els?.carTrack) return;
    els.carTrack.style.transition = animate
      ? `transform ${ANIM_MS}ms ease`
      : "none";
    els.carTrack.style.transform = `translate3d(${-i * 100}%, 0, 0)`;
  }

  function goToDish(i, animate = true) {
    const els = getModalEls();
    if (!modalItems.length || !els?.carTrack) return;
    if (isAnimating) return;

    modalIndex = (i + modalItems.length) % modalItems.length;

    updateText(modalIndex, els);
    updateDots(els);

    if (!animate) {
      setTransformIndex(modalIndex, false, els);
      requestAnimationFrame(() => {
        if (els.carTrack)
          els.carTrack.style.transition = `transform ${ANIM_MS}ms ease`;
      });
      return;
    }

    isAnimating = true;
    setTransformIndex(modalIndex, true, els);
    window.setTimeout(() => (isAnimating = false), ANIM_MS + 30);
  }

  function openDishByIndex(i) {
    const els = getModalEls();
    if (!els?.dishModal) return;

    if (!modalItems.length) collectVisibleItems();
    if (!modalItems.length) return;

    buildSlidesOnce(els);

    els.dishModal.classList.add("open");
    els.dishModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    goToDish(i, false);
  }

  function closeDishModal() {
    const els = getModalEls();
    if (!els?.dishModal) return;

    els.dishModal.classList.remove("open");
    els.dishModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function prevDish() {
    goToDish(modalIndex - 1, true);
  }

  function nextDish() {
    goToDish(modalIndex + 1, true);
  }

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
      const cur = getModalEls();
      if (!cur?.dishModal?.classList.contains("open")) return;
      if (isAnimating) return;
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

      const cur = getModalEls();
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
      const cur = getModalEls();
      if (!cur?.carTrack) return;

      cur.carTrack.style.transition = `transform 180ms ease`;
      cur.carTrack.style.transform = "translate3d(0,0,0)";
    }

    function swipeAndSwitch(dir) {
      const cur = getModalEls();
      if (!cur?.carTrack) return;

      isAnimating = true;

      cur.carTrack.style.transition = `transform 180ms ease`;
      cur.carTrack.style.transform =
        dir === 1 ? "translate3d(-100%,0,0)" : "translate3d(100%,0,0)";

      cur.carTrack.addEventListener(
        "transitionend",
        () => {
          modalIndex =
            (modalIndex + dir + modalItems.length) % modalItems.length;
          updateText(modalIndex, cur);
          updateDots(cur);

          requestAnimationFrame(() => {
            setTransformIndex(modalIndex, false, cur);
            requestAnimationFrame(() => {
              if (cur.carTrack)
                cur.carTrack.style.transition = `transform ${ANIM_MS}ms ease`;
              isAnimating = false;
            });
          });
        },
        { once: true },
      );
    }

    function onEnd() {
      if (!active) return;
      active = false;

      const cur = getModalEls();
      if (!cur?.carTrack) return;

      if (lock !== "x") {
        cur.carTrack.style.transition = `transform ${ANIM_MS}ms ease`;
        cur.carTrack.style.transform = `translate3d(${-modalIndex * 100}%,0,0)`;
        return;
      }

      if (Math.abs(dx) >= THRESHOLD && modalItems.length > 1) {
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
    const menuGrid = getMenuGrid();
    if (menuGrid && menuGrid.dataset.menuInited !== "1") {
      menuGrid.dataset.menuInited = "1";

      menuGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".menuCard");
        if (!card) return;

        collectVisibleItems();

        const t = card.dataset.title || "";
        const p = card.dataset.price || "";
        const idx = modalItems.findIndex((x) => x.title === t && x.price === p);

        openDishByIndex(idx >= 0 ? idx : 0);
      });
    }

    const els = getModalEls();
    if (els?.dishModal && els.dishModal.dataset.menuInited !== "1") {
      els.dishModal.dataset.menuInited = "1";

      els.dishClose?.addEventListener("click", closeDishModal);

      els.carPrev?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevDish();
      });

      els.carNext?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextDish();
      });

      window.addEventListener("keydown", (e) => {
        const cur = getModalEls();
        if (!cur?.dishModal?.classList.contains("open")) return;

        if (e.key === "Escape") closeDishModal();
        if (e.key === "ArrowLeft") prevDish();
        if (e.key === "ArrowRight") nextDish();
      });

      initSwipeOnce(els);
    } else if (els) {
      initSwipeOnce(els);
    }
  }

  document.addEventListener("DOMContentLoaded", initMenuOnce);
  document.body.addEventListener("htmx:load", initMenuOnce);
})();
