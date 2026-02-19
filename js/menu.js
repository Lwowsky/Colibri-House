(function () {
  const menuGrid = document.getElementById("menuGrid");

  const dishModal = document.getElementById("dishModal");
  const dishClose = document.getElementById("dishClose");

  const dishTitle = document.getElementById("dishTitle");
  const dishDesc = document.getElementById("dishDesc");
  const dishTag = document.getElementById("dishTag");
  const dishPrice = document.getElementById("dishPrice");

  const carTrack = document.getElementById("carTrack");
  const carDots = document.getElementById("carDots");
  const carPrev = document.getElementById("carPrev");
  const carNext = document.getElementById("carNext");

  const carViewport = document.querySelector("#dishModal .carViewport");

  let modalItems = [];
  let modalIndex = 0;
  let built = false;
  let isAnimating = false;

  const ANIM_MS = 280;
  const THRESHOLD = 70; // px для свайпу

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  function collectVisibleItems() {
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

  function buildSlidesOnce() {
    if (built) return;
    built = true;

    if (!carTrack || !carDots) return;

    carTrack.innerHTML = "";
    carDots.innerHTML = "";

    if (!modalItems.length) {
      carTrack.innerHTML = `<div class="carSlide placeholder"></div>`;
      return;
    }

    modalItems.forEach((it) => {
      const slide = document.createElement("div");
      slide.className = "carSlide";
      slide.innerHTML = it.cover
        ? `<img src="${esc(it.cover)}" alt="${esc(it.title)}" loading="eager" decoding="async" draggable="false">`
        : `<div class="carSlide placeholder"></div>`;
      carTrack.appendChild(slide);
    });

    const many = modalItems.length > 1;
    if (carPrev) carPrev.style.display = many ? "grid" : "none";
    if (carNext) carNext.style.display = many ? "grid" : "none";
    if (carDots) carDots.style.display = many ? "flex" : "none";

    if (many) {
      modalItems.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carDot";
        dot.addEventListener("click", () => goToDish(i, true));
        carDots.appendChild(dot);
      });
    }
  }

  function updateText(i) {
    const item = modalItems[i];
    if (!item) return;
    if (dishTitle) dishTitle.textContent = item.title || "";
    if (dishDesc) dishDesc.textContent = item.desc || "";
    if (dishTag) dishTag.textContent = item.tag || "";
    if (dishPrice) dishPrice.textContent = item.price || "";
  }

  function updateDots() {
    if (!carDots) return;
    const dots = [...carDots.querySelectorAll(".carDot")];
    dots.forEach((d, i) => d.classList.toggle("isActive", i === modalIndex));
  }

  function setTransformIndex(i, animate) {
    if (!carTrack) return;
    carTrack.style.transition = animate ? `transform ${ANIM_MS}ms ease` : "none";
    carTrack.style.transform = `translate3d(${-i * 100}%, 0, 0)`;
  }

  function goToDish(i, animate = true) {
    if (!modalItems.length || !carTrack) return;
    if (isAnimating) return;

    modalIndex = (i + modalItems.length) % modalItems.length;

    updateText(modalIndex);
    updateDots();

    if (!animate) {
      setTransformIndex(modalIndex, false);
      // повертаємо transition після “тихого” стрибка
      requestAnimationFrame(() => {
        if (carTrack) carTrack.style.transition = `transform ${ANIM_MS}ms ease`;
      });
      return;
    }

    isAnimating = true;
    setTransformIndex(modalIndex, true);
    window.setTimeout(() => (isAnimating = false), ANIM_MS + 30);
  }

  function openDishByIndex(i) {
    if (!dishModal) return;

    if (!modalItems.length) collectVisibleItems();
    if (!modalItems.length) return;

    buildSlidesOnce();

    dishModal.classList.add("open");
    dishModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    // перший показ — без анімації
    goToDish(i, false);
  }

  function closeDishModal() {
    dishModal?.classList.remove("open");
    dishModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  dishClose?.addEventListener("click", closeDishModal);

  // кліки по картках
  menuGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".menuCard");
    if (!card) return;

    collectVisibleItems();

    const t = card.dataset.title || "";
    const p = card.dataset.price || "";
    const idx = modalItems.findIndex((x) => x.title === t && x.price === p);

    openDishByIndex(idx >= 0 ? idx : 0);
  });

  function prevDish() {
    goToDish(modalIndex - 1, true);
  }
  function nextDish() {
    goToDish(modalIndex + 1, true);
  }

  carPrev?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    prevDish();
  });

  carNext?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    nextDish();
  });

  window.addEventListener("keydown", (e) => {
    if (!dishModal?.classList.contains("open")) return;
    if (e.key === "Escape") closeDishModal();
    if (e.key === "ArrowLeft") prevDish();
    if (e.key === "ArrowRight") nextDish();
  });

  // ==========================
  // ✅ SWIPE (як в інсті)
  // ==========================
  (function initSwipe() {
    if (!carViewport || !carTrack) return;

    let startX = 0,
      startY = 0,
      dx = 0,
      dy = 0,
      active = false,
      lock = null; // "x" або "y"

    function point(e) {
      return e.touches ? e.touches[0] : e;
    }

    function onStart(e) {
      if (!dishModal?.classList.contains("open")) return;
      if (isAnimating) return;
      if (e.target.closest(".carBtn")) return;

      const p = point(e);
      active = true;
      lock = null;
      dx = dy = 0;
      startX = p.clientX;
      startY = p.clientY;

      carTrack.style.transition = "none";
    }

    function onMove(e) {
      if (!active) return;

      const p = point(e);
      dx = p.clientX - startX;
      dy = p.clientY - startY;

      if (lock === null) {
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        if (ax > 8 || ay > 8) lock = ax > ay ? "x" : "y";
      }

      // горизонтальний жест — тягнемо трек, і блокуємо скрол
      if (lock === "x") {
        if (e.cancelable) e.preventDefault();
        carTrack.style.transform = `translate3d(${dx}px, 0, 0)`;
      }
    }

    function snapBack() {
      carTrack.style.transition = `transform 180ms ease`;
      carTrack.style.transform = "translate3d(0,0,0)";
    }

    function swipeAndSwitch(dir) {
      // dir: +1 next, -1 prev
      isAnimating = true;

      carTrack.style.transition = `transform 180ms ease`;
      carTrack.style.transform =
        dir === 1 ? "translate3d(-100%,0,0)" : "translate3d(100%,0,0)";

      carTrack.addEventListener(
        "transitionend",
        () => {
          // перемикаємо індекс (анімаційно вже норм, без “сірого ривка”)
          modalIndex = (modalIndex + dir + modalItems.length) % modalItems.length;
          updateText(modalIndex);
          updateDots();

          // одразу ставимо правильну позицію треку по %
          requestAnimationFrame(() => {
            setTransformIndex(modalIndex, false);
            requestAnimationFrame(() => {
              carTrack.style.transition = `transform ${ANIM_MS}ms ease`;
              isAnimating = false;
            });
          });
        },
        { once: true }
      );
    }

    function onEnd() {
      if (!active) return;
      active = false;

      if (lock !== "x") {
        carTrack.style.transition = `transform ${ANIM_MS}ms ease`;
        carTrack.style.transform = `translate3d(${-modalIndex * 100}%,0,0)`;
        return;
      }

      if (Math.abs(dx) >= THRESHOLD && modalItems.length > 1) {
        swipeAndSwitch(dx < 0 ? 1 : -1);
      } else {
        snapBack();
      }
    }

    carViewport.addEventListener("touchstart", onStart, { passive: true });
    carViewport.addEventListener("touchmove", onMove, { passive: false });
    carViewport.addEventListener("touchend", onEnd, { passive: true });
    carViewport.addEventListener("touchcancel", onEnd, { passive: true });

    // mouse drag (desktop)
    carViewport.addEventListener("mousedown", (e) => {
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
  })();
})();
