(() => {
  const App = window.App;
  const I18n = window.AppI18n;
  if (!App || !I18n) return;

  const { $$ } = App;
  const { setLang } = I18n;

  const LANG_KEY = "lang";
  const ALLOWED = ["ja", "en", "uk"];
  const DEFAULT = "ja";

  function normalizeLang(raw) {
    const v = String(raw || "").toLowerCase();
    const short = v.split("-")[0];
    return ALLOWED.includes(short) ? short : DEFAULT;
  }

  function getDeviceLang() {
    const langs =
      Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language || navigator.userLanguage || ""];

    for (const l of langs) {
      const short = normalizeLang(l);
      if (ALLOWED.includes(short)) return short;
    }
    return DEFAULT;
  }

  function applyLang(lang) {
    setLang(normalizeLang(lang));
  }

  function autoLangOnce() {
    if (document.documentElement.dataset.langAutoInited === "1") return;
    document.documentElement.dataset.langAutoInited = "1";

    const saved = localStorage.getItem(LANG_KEY);
    if (saved && ALLOWED.includes(saved)) {
      applyLang(saved);
      return;
    }

    const device = getDeviceLang();
    localStorage.setItem(LANG_KEY, device);
    applyLang(device);
  }

  function initLangButtonsOnce() {
    $$(".langbtn").forEach((b) => {
      if (b.dataset.inited === "1") return;
      b.dataset.inited = "1";

      b.addEventListener("click", () => {
        const chosen = normalizeLang(b.dataset.lang);
        localStorage.setItem(LANG_KEY, chosen);
        applyLang(chosen);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    autoLangOnce();
    initLangButtonsOnce();
  });

  document.body.addEventListener("htmx:load", () => {
    initLangButtonsOnce();
  });
})();