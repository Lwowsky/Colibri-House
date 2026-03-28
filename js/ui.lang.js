(() => {
  const App = window.App;
  const I18n = window.AppI18n;
  if (!App || !I18n) return;

  const { $$ } = App;
  const { setLang, ready } = I18n;

  const LANG_KEY = "lang";
  const ALLOWED = ["ja", "en", "uk"];
  const DEFAULT = "ja";

  function normalizeLang(raw) {
    const value = String(raw || "").toLowerCase();
    const short = value.split("-")[0];
    return ALLOWED.includes(short) ? short : DEFAULT;
  }

  function getDeviceLang() {
    const langs =
      Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language || navigator.userLanguage || ""];

    for (const lang of langs) {
      const short = normalizeLang(lang);
      if (ALLOWED.includes(short)) return short;
    }
    return DEFAULT;
  }

  async function applyLang(lang) {
    await ready?.();
    await setLang(normalizeLang(lang));
  }

  async function autoLangOnce() {
    if (document.documentElement.dataset.langAutoInited === "1") return;
    document.documentElement.dataset.langAutoInited = "1";

    const saved = localStorage.getItem(LANG_KEY);
    if (saved && ALLOWED.includes(saved)) {
      await applyLang(saved);
      return;
    }

    const device = getDeviceLang();
    localStorage.setItem(LANG_KEY, device);
    await applyLang(device);
  }

  function initLangButtonsOnce() {
    $$(".langbtn").forEach((button) => {
      if (button.dataset.inited === "1") return;
      button.dataset.inited = "1";

      button.addEventListener("click", async () => {
        const chosen = normalizeLang(button.dataset.lang);
        localStorage.setItem(LANG_KEY, chosen);
        await applyLang(chosen);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await autoLangOnce();
    initLangButtonsOnce();
  });

  document.body.addEventListener("htmx:load", async () => {
    initLangButtonsOnce();
    await applyLang(localStorage.getItem(LANG_KEY) || DEFAULT);
  });
})();
