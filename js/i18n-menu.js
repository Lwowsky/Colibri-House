(function () {
  const App = window.App;
  if (!App) return;

  const { $, $$, escapeHtml } = App;

  // ✅ дефолт — японська
  const DEFAULT_LANG = "ja";
  const supported = ["uk", "en", "ja"];

  const menuGrid = $("#menuGrid");
  const menuTabs = $("#menuTabs");

  let currentDict = null;
  let activeCat = null; // буде перша категорія зі списку
  let lastItems = [];

  // ✅ авто-вибір мови:
  // 1) localStorage (якщо юзер вже кликав)
  // 2) мова девайса: uk → en → ja
  // 3) fallback: ja
  function detectLang() {
    const saved = localStorage.getItem("lang");
    if (saved && supported.includes(saved)) return saved;

    const langs = (
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""]
    )
      .map((l) => String(l || "").toLowerCase())
      .filter(Boolean);

    if (langs.some((l) => l.startsWith("uk"))) return "uk";
    if (langs.some((l) => l.startsWith("en"))) return "en";
    if (langs.some((l) => l.startsWith("ja"))) return "ja";

    return DEFAULT_LANG; // ja
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

    // Якщо активна категорія ще не задана — беремо першу
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

    // кнопки мов (включно з тими, що прийдуть з partials)
    $$(".langbtn").forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false"),
    );

    // ✅ якщо конкретної мови нема — fallback на DEFAULT_LANG (ja)
    const dict = window.I18N?.[lang] || window.I18N?.[DEFAULT_LANG];
    if (!dict) return;

    currentDict = dict;
    lastItems = dict.menu_items || [];

    // переклад текстів
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key && dict[key] != null) el.textContent = dict[key];
    });

    // переклад placeholder
    $$("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key && dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });

    // tabs
    buildTabs(dict);

    // render menu
    renderMenu(filteredItems());
  }

  function getDict() {
    return currentDict;
  }

  window.AppI18n = { detectLang, setLang, getDict };
})();