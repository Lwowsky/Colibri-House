(() => {
  const App = window.App;
  if (!App) return;

  const { $, $$, escapeHtml } = App;
  const DEFAULT_LANG = window.ContentStore?.getDefaultLanguage?.() || "ja";
  const supported = window.ContentStore?.getLanguages?.() || ["uk", "en", "ja"];

  let currentDict = null;
  let activeCat = null;
  let lastItems = [];

  function getMenuGrid() {
    return $("#menuGrid");
  }

  function getMenuTabs() {
    return $("#menuTabs");
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

  function renderMenu(items) {
    const menuGrid = getMenuGrid();
    if (!menuGrid) return;

    menuGrid.innerHTML = "";

    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "menuCard";

      div.dataset.id = it.id || "";
      div.dataset.title = it.title || "";
      div.dataset.desc = it.sub || "";
      div.dataset.price = it.price || "";
      div.dataset.tag = it.tag || "";
      div.dataset.img = it.img || "";
      div.dataset.imgs = JSON.stringify(it.imgs || []);

      const imgHtml = it.img
        ? `<img src="${escapeHtml(it.img)}" alt="${escapeHtml(
            it.title,
          )}" loading="lazy" decoding="async">`
        : `<div style="height:100%;width:100%;background:rgba(0,0,0,.04)"></div>`;

      div.innerHTML = `
        <div class="menuImgWrap">${imgHtml}</div>
        <div class="menuBody">
          <h3 class="menuTitle">${escapeHtml(it.title)}</h3>
          <p class="menuDesc">${escapeHtml(it.sub || "")}</p>
          <div class="menuBottom">
            ${
              it.tag
                ? `<span class="menuTag">${escapeHtml(it.tag)}</span>`
                : `<span></span>`
            }
            <span class="menuPrice">${escapeHtml(it.price || "")}</span>
          </div>
        </div>
      `;

      menuGrid.appendChild(div);
    });
  }

  function buildTabs(dict) {
    const menuTabs = getMenuTabs();
    if (!menuTabs) return;

    const cats = dict.menu_categories || [];
    menuTabs.innerHTML = "";

    if (!cats.length) {
      activeCat = null;
      return;
    }

    const availableCats = new Set(
      (dict.menu_items || []).map((item) => item.cat || "mains"),
    );

    const visibleCats = cats.filter((category) => availableCats.has(category.id));
    const tabs = visibleCats.length ? visibleCats : cats;

    if (!activeCat || !tabs.some((category) => category.id === activeCat)) {
      activeCat = tabs[0].id;
    }

    tabs.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tabBtn";
      button.dataset.cat = category.id;
      button.setAttribute("role", "tab");
      button.textContent = category.label;

      button.addEventListener("click", () => {
        activeCat = category.id;
        setActiveTabUI();
        renderMenu(filteredItems());
      });

      menuTabs.appendChild(button);
    });

    setActiveTabUI();
  }

  function applyText(dict) {
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key && dict[key] != null) el.textContent = dict[key];
    });

    $$("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key && dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });
  }

  function normalizeLang(raw) {
    const lang = String(raw || "").toLowerCase().split("-")[0];
    return supported.includes(lang) ? lang : DEFAULT_LANG;
  }

  async function setLang(lang) {
    lang = normalizeLang(lang);

    try {
      await window.ContentStore?.ready?.();
    } catch (error) {
      console.error("Unable to apply translations", error);
      return;
    }

    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;

    $$(".langbtn").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
    });

    const dict = window.I18N?.[lang] || window.I18N?.[DEFAULT_LANG];
    if (!dict) return;

    currentDict = dict;
    lastItems = dict.menu_items || [];

    applyText(dict);
    buildTabs(dict);
    renderMenu(filteredItems());
  }

  function getDict() {
    return currentDict;
  }

  window.AppI18n = {
    setLang,
    getDict,
    ready: () => window.ContentStore?.ready?.() || Promise.resolve(),
  };

  document.body.addEventListener("htmx:load", () => {
    const lang = localStorage.getItem("lang") || DEFAULT_LANG;
    setLang(lang);
  });
})();
