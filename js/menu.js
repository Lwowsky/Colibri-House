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

  let modalItems = [];
  let modalIndex = 0;
  let built = false; // ✅ щоб будувати слайди лише 1 раз на відкриття

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  function collectVisibleItems() {
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

    built = false; // ✅ при зміні категорії/списку — перебудуємо
  }

  function buildSlidesOnce() {
    if (built) return;
    built = true;

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
        ? `<img src="${esc(it.cover)}" alt="${esc(it.title)}" loading="eager" decoding="async">`
        : `<div class="carSlide placeholder"></div>`;
      carTrack.appendChild(slide);
    });

    // dots
    const many = modalItems.length > 1;
    carPrev.style.display = many ? "grid" : "none";
    carNext.style.display = many ? "grid" : "none";
    carDots.style.display = many ? "flex" : "none";

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
    dishTitle.textContent = item?.title || "";
    dishDesc.textContent = item?.desc || "";
    dishTag.textContent = item?.tag || "";
    dishPrice.textContent = item?.price || "";
  }

  function updateDots() {
    const dots = [...carDots.querySelectorAll(".carDot")];
    dots.forEach((d, i) => d.classList.toggle("isActive", i === modalIndex));
  }

  function setTransform(i, animate) {
    if (!carTrack) return;

    carTrack.style.transition = animate ? "transform 280ms ease" : "none";
    carTrack.style.transform = `translate3d(${-i * 100}%, 0, 0)`;

    // ✅ повертаємо transition назад (щоб не зламати наступні)
    if (!animate) requestAnimationFrame(() => (carTrack.style.transition = "transform 280ms ease"));
  }

  function goToDish(i, animate = true) {
    if (!modalItems.length) return;

    modalIndex = (i + modalItems.length) % modalItems.length;

    updateText(modalIndex);
    updateDots();
    setTransform(modalIndex, animate);
  }

  function openDishByIndex(i) {
    if (!dishModal) return;

    if (!modalItems.length) collectVisibleItems();
    if (!modalItems.length) return;

    buildSlidesOnce();

    dishModal.classList.add("open");
    dishModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    // ✅ перший показ — без анімації, щоб не “підстрибувало”
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
})();
