(function () {
  const menuGrid = document.getElementById("menuGrid");

  // modal
  const dishModal = document.getElementById("dishModal");
  const dishClose = document.getElementById("dishClose");

  const dishTitle = document.getElementById("dishTitle");
  const dishDesc = document.getElementById("dishDesc");
  const dishTag = document.getElementById("dishTag");
  const dishPrice = document.getElementById("dishPrice");

  // carousel UI (але тепер це карусель по стравах)
  const carTrack = document.getElementById("carTrack");
  const carDots = document.getElementById("carDots");
  const carPrev = document.getElementById("carPrev");
  const carNext = document.getElementById("carNext");

  // ✅ список страв (тільки видимі з menuGrid) + активний індекс
  let modalItems = [];
  let modalIndex = 0;

  // ---- helpers ----
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

  function collectVisibleItems() {
    // беремо всі меню-картки, які зараз відрендерені (поточна категорія)
    const cards = [...menuGrid.querySelectorAll(".menuCard")];

    modalItems = cards.map((card) => {
      let imgs = [];
      try {
        imgs = JSON.parse(card.dataset.imgs || "[]");
      } catch {
        imgs = [];
      }

      return {
        title: card.dataset.title || "",
        desc: card.dataset.desc || "",
        price: card.dataset.price || "",
        tag: card.dataset.tag || "",
        img: card.dataset.img || "",
        imgs,
      };
    });
  }

  function openDishByIndex(i) {
    if (!dishModal) return;

    if (!modalItems.length) collectVisibleItems();
    if (!modalItems.length) return;

    modalIndex = (i + modalItems.length) % modalItems.length;
    const item = modalItems[modalIndex];

    // text
    dishTitle.textContent = item.title || "";
    dishDesc.textContent = item.desc || "";
    dishTag.textContent = item.tag || "";
    dishPrice.textContent = item.price || "";

    // photos: imgs[] якщо є, інакше img
    const imgs =
      Array.isArray(item.imgs) && item.imgs.length
        ? item.imgs
        : item.img
          ? [item.img]
          : [];

    buildDishSlides(imgs, item.title);
    updateDishDots();

    // open
    dishModal.classList.add("open");
    dishModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeDishModal() {
    dishModal?.classList.remove("open");
    dishModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  dishClose?.addEventListener("click", closeDishModal);
  dishModal?.addEventListener("click", (e) => {
    if (e.target === dishModal) closeDishModal();
  });

  // ✅ кліки по картках
  menuGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".menuCard");
    if (!card) return;

    // оновлюємо список видимих страв
    collectVisibleItems();

    // знаходимо індекс натиснутої (по title+price як ключ)
    const t = card.dataset.title || "";
    const p = card.dataset.price || "";
    const idx = modalItems.findIndex((x) => x.title === t && x.price === p);

    openDishByIndex(idx >= 0 ? idx : 0);
  });

  // ✅ Prev/Next тепер перемикають СТРАВИ
  function prevDish() {
    openDishByIndex(modalIndex - 1);
  }
  function nextDish() {
    openDishByIndex(modalIndex + 1);
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

  function buildDishSlides(imgs, title) {
    carTrack.innerHTML = "";
    carDots.innerHTML = "";

    if (!imgs.length) {
      carTrack.innerHTML = `<div class="carSlide placeholder"></div>`;
      return;
    }

    imgs.forEach((src) => {
      const slide = document.createElement("div");
      slide.className = "carSlide";
      slide.innerHTML = `<img src="${esc(src)}" alt="${esc(title || "")}" loading="lazy">`;
      carTrack.appendChild(slide);
    });

    // показуємо перше фото завжди
    carTrack.style.transform = `translateX(0%)`;
  }

  // Dots тепер по стравах (а не по фотках)
  function updateDishDots() {
    carDots.innerHTML = "";

    const many = modalItems.length > 1;
    carPrev.style.display = many ? "grid" : "none";
    carNext.style.display = many ? "grid" : "none";
    carDots.style.display = many ? "flex" : "none";

    if (!many) return;

    modalItems.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carDot" + (i === modalIndex ? " isActive" : "");
      dot.addEventListener("click", () => openDishByIndex(i));
      carDots.appendChild(dot);
    });
  }
})();
