(() => {
  const LANGS = ["uk", "en", "ja"];
  const DEFAULT_LANG = "ja";
  const PATHS = {
    site: "content/site.json",
    categories: "content/categories.json",
    menu: "content/menu.json",
  };

  let cachedBundle = null;
  let readyPromise = null;

  const normalizeTranslations = (value) => {
    const obj = value && typeof value === "object" ? value : {};
    const fallback = obj[DEFAULT_LANG] || obj.uk || obj.en || "";
    return {
      uk: obj.uk ?? fallback,
      en: obj.en ?? fallback,
      ja: obj.ja ?? fallback,
    };
  };

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load ${path}: ${res.status}`);
    }
    return res.json();
  }

  function sortBySort(arr) {
    return [...arr].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  }

  function buildDicts(bundle) {
    const dicts = Object.fromEntries(LANGS.map((lang) => [lang, {}]));

    for (const [key, value] of Object.entries(bundle.site || {})) {
      const tr = normalizeTranslations(value);
      for (const lang of LANGS) {
        dicts[lang][key] = tr[lang];
      }
    }

    const categories = sortBySort(bundle.categories || []).map((category) => ({
      id: category.id,
      sort: Number(category.sort) || 0,
      label: normalizeTranslations(category.label),
    }));

    const menuItems = sortBySort(bundle.menu || []).map((item) => ({
      id: item.id,
      sort: Number(item.sort) || 0,
      active: item.active !== false,
      cat: item.cat || "mains",
      price: item.price || "",
      img: item.img || "",
      imgs: Array.isArray(item.imgs) ? item.imgs.filter(Boolean) : [],
      title: normalizeTranslations(item.title),
      sub: normalizeTranslations(item.sub),
      tag: normalizeTranslations(item.tag),
    }));

    for (const lang of LANGS) {
      dicts[lang].menu_categories = categories.map((category) => ({
        id: category.id,
        label: category.label[lang],
        sort: category.sort,
      }));

      dicts[lang].menu_items = menuItems
        .filter((item) => item.active !== false)
        .map((item) => ({
          id: item.id,
          sort: item.sort,
          active: item.active,
          cat: item.cat,
          price: item.price,
          img: item.img,
          imgs: item.imgs,
          title: item.title[lang],
          sub: item.sub[lang],
          tag: item.tag[lang],
        }));
    }

    return dicts;
  }

  async function loadBundle() {
    if (cachedBundle) return cachedBundle;

    const [site, categories, menu] = await Promise.all([
      fetchJson(PATHS.site),
      fetchJson(PATHS.categories),
      fetchJson(PATHS.menu),
    ]);

    const bundle = {
      site,
      categories,
      menu,
    };

    bundle.dicts = buildDicts(bundle);
    window.I18N = bundle.dicts;
    cachedBundle = bundle;
    return bundle;
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = loadBundle().catch((error) => {
        console.error("Content load failed", error);
        readyPromise = null;
        throw error;
      });
    }
    return readyPromise;
  }

  window.ContentStore = {
    ready,
    getBundle: () => cachedBundle,
    getDicts: () => cachedBundle?.dicts || null,
    getLanguages: () => [...LANGS],
    getDefaultLanguage: () => DEFAULT_LANG,
  };
})();
