(function () {
  const { $, $$, escapeHtml } = window.App;

  const DEFAULT_LANG = "uk";
  const supported = ["uk", "en", "ja"];

  const menuGrid = $("#menuGrid");
  const menuTabs = $("#menuTabs");

  let currentDict = null;
  let activeCat = null; // буде перша категорія зі списку
  let lastItems = [];

  function detectLang() {
    const saved = localStorage.getItem("lang");
    if (saved && supported.includes(saved)) return saved;

    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("ja")) return "ja";
    if (nav.startsWith("uk")) return "uk";
    return "en";
  }

  function renderMenu(items) {
    if (!menuGrid) return;
    menuGrid.innerHTML = "";

    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "menuCard";

      // ✅ збережемо все, що треба для модалки
      div.dataset.title = it.title || "";
      div.dataset.desc = it.sub || "";
      div.dataset.price = it.price || "";
      div.dataset.tag = it.tag || "";
      div.dataset.img = it.img || "";
      div.dataset.imgs = JSON.stringify(it.imgs || []);
      const imgHtml = it.img
        ? `<img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.title)}" loading="lazy" decoding="async">`
        : `<div style="height:100%;width:100%;background:rgba(0,0,0,.04)"></div>`;

      div.innerHTML = `
      <div class="menuImgWrap">${imgHtml}</div>
      <div class="menuBody">
        <h3 class="menuTitle">${escapeHtml(it.title)}</h3>
        <p class="menuDesc">${escapeHtml(it.sub || "")}</p>

        <div class="menuBottom">
          ${it.tag ? `<span class="menuTag">${escapeHtml(it.tag)}</span>` : `<span></span>`}
          <span class="menuPrice">${escapeHtml(it.price || "")}</span>
        </div>
      </div>
    `;

      menuGrid.appendChild(div);
    });
  }

  function filteredItems() {
    if (!activeCat) return lastItems;
    return lastItems.filter((it) => (it.cat || "mains") === activeCat);
  }

  function setActiveTabUI() {
    if (!menuTabs) return;
    $$(".tabBtn", menuTabs).forEach((b) => {
      b.setAttribute(
        "aria-selected",
        b.dataset.cat === activeCat ? "true" : "false",
      );
    });
  }

  function buildTabs(dict) {
    if (!menuTabs) return;
    const cats = dict.menu_categories || [];

    menuTabs.innerHTML = "";

    // Якщо активна категорія ще не задана — беремо першу (як на скріні)
    if (!activeCat && cats.length) activeCat = cats[0].id;

    cats.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tabBtn";
      b.dataset.cat = c.id;
      b.setAttribute("role", "tab");
      b.textContent = c.label;

      b.addEventListener("click", () => {
        activeCat = c.id;
        setActiveTabUI();
        renderMenu(filteredItems());
      });

      menuTabs.appendChild(b);
    });

    setActiveTabUI();
  }

  function setLang(lang) {
    if (!supported.includes(lang)) lang = DEFAULT_LANG;
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;

    $$(".langbtn").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        b.dataset.lang === lang ? "true" : "false",
      ),
    );

    const dict = window.I18N?.[lang] || window.I18N?.[DEFAULT_LANG];
    if (!dict) return;

    currentDict = dict;
    lastItems = dict.menu_items || [];

    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });

    // tabs above images
    buildTabs(dict);

    // render
    renderMenu(filteredItems());
  }

  function getDict() {
    return currentDict;
  }

  window.AppI18n = { detectLang, setLang, getDict };
})();

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

  // ---- “слайди” всередині модалки (показуємо 1-й img страви або робимо кілька, якщо хочеш) ----
  // Тут я роблю просто: якщо у страви кілька imgs — показуємо їх як горизонтальний трек.
  // Але Prev/Next — по стравах, а не по imgs.
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
