(() => {
  const App = window.App;
  if (!App) return;

  const { $, $$, escapeHtml } = App;

  const DEFAULT_LANG = "uk";
  const supported = ["uk", "en", "ja"];

  let currentDict = null;
  let currentLang = null;

  let activeCat = null; // перша категорія зі списку
  let lastItems = [];

  function getMenuGrid() {
    return $("#menuGrid");
  }

  function getMenuTabs() {
    return $("#menuTabs");
  }

  function detectLang() {
    const saved = localStorage.getItem("lang");
    if (saved && supported.includes(saved)) return saved;

    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("ja")) return "ja";
    if (nav.startsWith("uk")) return "uk";
    return "en";
  }

  function renderMenu(items) {
    const menuGrid = getMenuGrid();
    if (!menuGrid) return;

    menuGrid.innerHTML = "";

    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "menuCard";

      // дані для модалки
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
    const menuTabs = getMenuTabs();
    if (!menuTabs) return;

    $$(".tabBtn", menuTabs).forEach((b) => {
      b.setAttribute(
        "aria-selected",
        b.dataset.cat === activeCat ? "true" : "false",
      );
    });
  }

  function buildTabs(dict) {
    const menuTabs = getMenuTabs();
    if (!menuTabs) return;

    const cats = dict.menu_categories || [];
    menuTabs.innerHTML = "";

    // якщо активна категорія ще не задана — беремо першу
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

  function applyTranslations(dict) {
    // перевод текстів
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key && dict[key]) el.textContent = dict[key];
    });

    // перевод placeholder
    $$("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key && dict[key]) el.setAttribute("placeholder", dict[key]);
    });

    // aria-pressed на кнопках мови
    $$(".langbtn").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        b.dataset.lang === currentLang ? "true" : "false",
      ),
    );
  }

  function setLang(lang) {
    if (!supported.includes(lang)) lang = DEFAULT_LANG;

    currentLang = lang;
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;

    const dict = window.I18N?.[lang] || window.I18N?.[DEFAULT_LANG];
    if (!dict) return;

    currentDict = dict;
    lastItems = dict.menu_items || [];

    applyTranslations(dict);

    // tabs + menu
    buildTabs(dict);
    renderMenu(filteredItems());
  }

  function getDict() {
    return currentDict;
  }

  // re-apply after htmx swaps (нові елементи теж перекладуться і меню з'явиться)
  function rehydrate() {
    const lang = currentLang || document.documentElement.lang || detectLang();
    setLang(lang);
  }

  // Expose API
  window.AppI18n = { detectLang, setLang, getDict };

  document.addEventListener("DOMContentLoaded", rehydrate);
  document.body.addEventListener("htmx:load", rehydrate);
})();