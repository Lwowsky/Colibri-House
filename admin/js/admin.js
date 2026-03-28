(() => {
  const LANGS = ["uk", "en", "ja"];
  const STORAGE_KEYS = {
    apiBase: "colibriAdminApiBase",
    token: "colibriAdminToken",
  };
  const STATIC_ROOT = new URL("../", window.location.href);
  const state = {
    bundle: {
      site: {},
      categories: [],
      menu: [],
    },
    activeTab: "menu",
    apiBase: "",
    authToken: sessionStorage.getItem(STORAGE_KEYS.token) || "",
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    loginScreen: $("#loginScreen"),
    appScreen: $("#appScreen"),
    loginForm: $("#loginForm"),
    usernameInput: $("#username"),
    passwordInput: $("#password"),
    loginMessage: $("#loginMessage"),
    apiBaseInput: $("#apiBaseInput"),
    apiBaseMessage: $("#apiBaseMessage"),
    saveApiBaseButton: $("#saveApiBaseButton"),
    testApiBaseButton: $("#testApiBaseButton"),
    apiBaseLabel: $("#apiBaseLabel"),
    menuCount: $("#menuCount"),
    categoryCount: $("#categoryCount"),
    textCount: $("#textCount"),
    commitMessage: $("#commitMessage"),
    saveButton: $("#saveButton"),
    reloadButton: $("#reloadButton"),
    logoutButton: $("#logoutButton"),
    addMenuItemButton: $("#addMenuItemButton"),
    addCategoryButton: $("#addCategoryButton"),
    addTextKeyButton: $("#addTextKeyButton"),
    menuEditor: $("#menuEditor"),
    categoriesEditor: $("#categoriesEditor"),
    textsEditor: $("#textsEditor"),
    toast: $("#toast"),
  };

  let toastTimer = null;

  function normalizeApiBase(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    return trimmed.replace(/\/+$/, "");
  }

  function getInitialApiBase() {
    const fromQuery = new URLSearchParams(window.location.search).get("apiBase");
    if (fromQuery) return normalizeApiBase(fromQuery);
    const fromStorage = localStorage.getItem(STORAGE_KEYS.apiBase);
    if (fromStorage) return normalizeApiBase(fromStorage);
    return "";
  }

  function setApiBase(value, options = {}) {
    const normalized = normalizeApiBase(value);
    state.apiBase = normalized;
    if (els.apiBaseInput) els.apiBaseInput.value = normalized;
    if (els.apiBaseLabel) els.apiBaseLabel.textContent = normalized || "Same-origin API";
    if (options.persist === false) return;
    if (normalized) localStorage.setItem(STORAGE_KEYS.apiBase, normalized);
    else localStorage.removeItem(STORAGE_KEYS.apiBase);
  }

  function setApiBaseMessage(message, type = "") {
    if (!els.apiBaseMessage) return;
    els.apiBaseMessage.textContent = message || "";
    els.apiBaseMessage.className = "helper-text";
    if (type) els.apiBaseMessage.classList.add(`is-${type}`);
  }

  function apiUrl(path) {
    return state.apiBase ? `${state.apiBase}${path}` : path;
  }

  async function apiRequest(path, options = {}) {
    const init = {
      method: options.method || "GET",
      credentials: state.apiBase ? "omit" : "same-origin",
      headers: {},
    };

    if (options.json) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.json);
    }

    if (state.authToken) {
      init.headers.Authorization = `Bearer ${state.authToken}`;
    }

    const res = await fetch(apiUrl(path), init);
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();

    if (res.status === 401 && state.authToken) {
      state.authToken = "";
      sessionStorage.removeItem(STORAGE_KEYS.token);
    }

    if (!res.ok || (data && typeof data === "object" && data.ok === false)) {
      const message = typeof data === "object" && data?.error ? data.error : `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data;
  }

  function resolveAssetUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return new URL(path.replace(/^\/+/, ""), STATIC_ROOT).toString();
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function setLoginMessage(message, type = "") {
    if (!els.loginMessage) return;
    els.loginMessage.textContent = message || "";
    els.loginMessage.className = "helper-text";
    if (type) els.loginMessage.classList.add(`is-${type}`);
  }

  function setLoading(button, isLoading, label) {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = label || "Processing...";
    } else {
      button.disabled = false;
      if (button.dataset.originalLabel) button.textContent = button.dataset.originalLabel;
    }
  }

  function showApp() {
    els.loginScreen?.classList.add("hidden");
    els.appScreen?.classList.remove("hidden");
  }

  function showLogin() {
    els.appScreen?.classList.add("hidden");
    els.loginScreen?.classList.remove("hidden");
  }

  function nextSort(items) {
    const current = items.reduce((max, item) => Math.max(max, Number(item.sort) || 0), 0);
    return current + 10;
  }

  function emptyTranslations() {
    return { uk: "", en: "", ja: "" };
  }

  function defaultMenuItem() {
    const defaultCategory = state.bundle.categories[0]?.id || "mains";
    return {
      id: `menu-item-${Date.now()}`,
      sort: nextSort(state.bundle.menu),
      active: true,
      cat: defaultCategory,
      price: "¥0",
      img: "",
      imgs: [],
      title: emptyTranslations(),
      sub: emptyTranslations(),
      tag: emptyTranslations(),
    };
  }

  function defaultCategory() {
    return {
      id: `new-category-${Date.now()}`,
      sort: nextSort(state.bundle.categories),
      label: emptyTranslations(),
    };
  }

  function defaultTextEntry() {
    return {
      key: `new_text_key_${Date.now()}`,
      value: emptyTranslations(),
    };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function renderMenuEditor() {
    const categories = [...state.bundle.categories].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    const categoryOptions = categories
      .map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label?.uk || category.id)}</option>`)
      .join("");

    const items = [...state.bundle.menu].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    if (!items.length) {
      els.menuEditor.innerHTML = '<div class="empty-note">Меню порожнє. Додай першу страву.</div>';
      return;
    }

    els.menuEditor.innerHTML = items
      .map((item, index) => {
        const preview = item.img
          ? `<img src="${escapeHtml(resolveAssetUrl(item.img))}" alt="${escapeHtml(item.title?.uk || item.id)}" />`
          : "<span>No image selected</span>";

        const translationBoxes = LANGS.map(
          (lang) => `
            <div class="translation-box">
              <h4>${lang.toUpperCase()}</h4>
              <label class="translation-field">
                Title
                <input data-lang="${lang}" data-translation="title" type="text" value="${escapeHtml(item.title?.[lang] || "")}" />
              </label>
              <label class="translation-field">
                Tag
                <input data-lang="${lang}" data-translation="tag" type="text" value="${escapeHtml(item.tag?.[lang] || "")}" />
              </label>
              <label class="translation-field">
                Description
                <textarea data-lang="${lang}" data-translation="sub">${escapeHtml(item.sub?.[lang] || "")}</textarea>
              </label>
            </div>
          `,
        ).join("");

        return `
          <article class="admin-card" data-entity="menu-item" data-index="${index}">
            <div class="card-head">
              <div>
                <h3>${escapeHtml(item.title?.uk || item.id || `Item ${index + 1}`)}</h3>
                <small>ID: ${escapeHtml(item.id || "")}</small>
              </div>
              <div class="inline-actions">
                <button class="btn btn-danger" type="button" data-action="delete-menu-item" data-index="${index}">Видалити</button>
              </div>
            </div>

            <div class="card-grid">
              <label>
                Item ID
                <input data-field="id" type="text" value="${escapeHtml(item.id || "")}" />
              </label>
              <label>
                Category
                <select data-field="cat">${categoryOptions}</select>
              </label>
              <label>
                Price
                <input data-field="price" type="text" value="${escapeHtml(item.price || "")}" />
              </label>
              <label>
                Sort
                <input data-field="sort" type="number" value="${escapeHtml(item.sort || 0)}" />
              </label>
              <label class="toggle-row">
                <input data-field="active" type="checkbox" ${item.active !== false ? "checked" : ""} />
                <span>Visible on site</span>
              </label>
              <div></div>

              <label class="span-4">
                Image path / URL
                <input data-field="img" type="text" value="${escapeHtml(item.img || "")}" placeholder="img/menu/item.jpg or /content/uploads/menu/item.jpg" />
              </label>

              <div class="uploader span-2">
                <label>
                  Upload image to GitHub
                  <input data-upload-input type="file" accept="image/*" />
                </label>
                <small class="muted">Файл завантажиться в <code>content/uploads/menu</code> і шлях підставиться автоматично.</small>
              </div>

              <div class="image-preview span-6" data-image-preview>${preview}</div>
            </div>

            <div class="translation-grid">${translationBoxes}</div>
          </article>
        `;
      })
      .join("");

    $$('[data-entity="menu-item"] select[data-field="cat"]', els.menuEditor).forEach((select, index) => {
      const item = items[index];
      if (item) select.value = item.cat || "";
    });
  }

  function renderCategoriesEditor() {
    const categories = [...state.bundle.categories].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    if (!categories.length) {
      els.categoriesEditor.innerHTML = '<div class="empty-note">Немає категорій. Додай першу категорію.</div>';
      return;
    }

    els.categoriesEditor.innerHTML = categories
      .map(
        (category, index) => `
          <article class="admin-card" data-entity="category" data-index="${index}">
            <div class="card-head">
              <div>
                <h3>${escapeHtml(category.label?.uk || category.id || `Category ${index + 1}`)}</h3>
                <small>Category tab in menu</small>
              </div>
              <button class="btn btn-danger" type="button" data-action="delete-category" data-index="${index}">Видалити</button>
            </div>

            <div class="card-grid">
              <label>
                Category ID
                <input data-field="id" type="text" value="${escapeHtml(category.id || "")}" />
              </label>
              <label>
                Sort
                <input data-field="sort" type="number" value="${escapeHtml(category.sort || 0)}" />
              </label>
            </div>

            <div class="translation-grid">
              ${LANGS.map(
                (lang) => `
                  <div class="translation-box">
                    <h4>${lang.toUpperCase()}</h4>
                    <label class="translation-field">
                      Label
                      <input data-lang="${lang}" data-translation="label" type="text" value="${escapeHtml(category.label?.[lang] || "")}" />
                    </label>
                  </div>
                `,
              ).join("")}
            </div>
          </article>
        `,
      )
      .join("");
  }

  function renderTextsEditor() {
    const entries = Object.entries(state.bundle.site || {}).sort(([a], [b]) => a.localeCompare(b));
    if (!entries.length) {
      els.textsEditor.innerHTML = '<div class="empty-note">Немає текстових ключів. Додай перший ключ.</div>';
      return;
    }

    els.textsEditor.innerHTML = entries
      .map(
        ([key, value], index) => `
          <article class="admin-card" data-entity="site-text" data-index="${index}">
            <div class="card-head">
              <div>
                <h3>${escapeHtml(key)}</h3>
                <small>Key used in <code>data-i18n</code></small>
              </div>
              <button class="btn btn-danger" type="button" data-action="delete-text" data-key="${escapeHtml(key)}">Видалити</button>
            </div>

            <div class="card-grid">
              <label class="span-6">
                Text key
                <input data-field="key" type="text" value="${escapeHtml(key)}" />
              </label>
            </div>

            <div class="translation-grid">
              ${LANGS.map(
                (lang) => `
                  <div class="translation-box">
                    <h4>${lang.toUpperCase()}</h4>
                    <label class="translation-field">
                      Value
                      <textarea data-lang="${lang}" data-translation="value">${escapeHtml(value?.[lang] || "")}</textarea>
                    </label>
                  </div>
                `,
              ).join("")}
            </div>
          </article>
        `,
      )
      .join("");
  }

  function updateStats() {
    els.menuCount.textContent = String(state.bundle.menu.length);
    els.categoryCount.textContent = String(state.bundle.categories.length);
    els.textCount.textContent = String(Object.keys(state.bundle.site || {}).length);
    els.apiBaseLabel.textContent = 'Same-origin API';
  }

  function renderAll() {
    renderMenuEditor();
    renderCategoriesEditor();
    renderTextsEditor();
    updateStats();
    activateTab(state.activeTab);
  }

  function valueOf(input, fallback = "") {
    return input ? String(input.value || "").trim() : fallback;
  }

  function collectMenuFromDom() {
    return $$('[data-entity="menu-item"]', els.menuEditor).map((card) => {
      const item = {
        id: valueOf($("[data-field='id']", card)),
        sort: Number(valueOf($("[data-field='sort']", card), 0)) || 0,
        active: $("[data-field='active']", card)?.checked !== false,
        cat: valueOf($("[data-field='cat']", card), "mains"),
        price: valueOf($("[data-field='price']", card)),
        img: valueOf($("[data-field='img']", card)),
        imgs: [],
        title: emptyTranslations(),
        sub: emptyTranslations(),
        tag: emptyTranslations(),
      };

      LANGS.forEach((lang) => {
        item.title[lang] = valueOf($(`[data-translation='title'][data-lang='${lang}']`, card));
        item.sub[lang] = valueOf($(`[data-translation='sub'][data-lang='${lang}']`, card));
        item.tag[lang] = valueOf($(`[data-translation='tag'][data-lang='${lang}']`, card));
      });

      return item;
    });
  }

  function collectCategoriesFromDom() {
    return $$('[data-entity="category"]', els.categoriesEditor).map((card) => {
      const category = {
        id: valueOf($("[data-field='id']", card)),
        sort: Number(valueOf($("[data-field='sort']", card), 0)) || 0,
        label: emptyTranslations(),
      };

      LANGS.forEach((lang) => {
        category.label[lang] = valueOf($(`[data-translation='label'][data-lang='${lang}']`, card));
      });

      return category;
    });
  }

  function collectTextsFromDom() {
    const result = {};

    $$('[data-entity="site-text"]', els.textsEditor).forEach((card) => {
      const key = valueOf($("[data-field='key']", card));
      if (!key) return;
      result[key] = emptyTranslations();
      LANGS.forEach((lang) => {
        result[key][lang] = valueOf($(`[data-translation='value'][data-lang='${lang}']`, card));
      });
    });

    return result;
  }

  function syncStateFromDom() {
    if (!els.appScreen || els.appScreen.classList.contains("hidden")) return;
    state.bundle.menu = collectMenuFromDom();
    state.bundle.categories = collectCategoriesFromDom();
    state.bundle.site = collectTextsFromDom();
  }

  function ensureUnique(values, label) {
    const seen = new Set();
    for (const value of values) {
      if (!value) throw new Error(`${label}: empty value is not allowed.`);
      if (seen.has(value)) throw new Error(`${label}: duplicate value “${value}”.`);
      seen.add(value);
    }
  }

  function validateBundle(bundle) {
    ensureUnique(bundle.categories.map((category) => category.id), "Category ID");
    ensureUnique(bundle.menu.map((item) => item.id), "Menu item ID");
    ensureUnique(Object.keys(bundle.site), "Text key");

    const categoryIds = new Set(bundle.categories.map((category) => category.id));
    bundle.menu.forEach((item) => {
      if (!categoryIds.has(item.cat)) {
        throw new Error(`Menu item “${item.id}” refers to missing category “${item.cat}”.`);
      }
    });
  }

  function activateTab(tabName) {
    state.activeTab = tabName;
    $$(".tab").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === tabName);
    });
    $$(".tab-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== tabName);
    });
  }

  async function loadBundle() {
    const data = await apiRequest("/api/admin/content");
    state.bundle = {
      site: data.site || {},
      categories: Array.isArray(data.categories) ? data.categories : [],
      menu: Array.isArray(data.menu) ? data.menu : [],
    };
    renderAll();
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginMessage("");
    setLoading(els.loginForm.querySelector("button[type='submit']"), true, "Вхід...");

    try {
      const data = await apiRequest("/api/admin/login", {
        method: "POST",
        json: {
          username: valueOf(els.usernameInput),
          password: els.passwordInput.value,
        },
      });

      if (data?.token) {
        state.authToken = data.token;
        sessionStorage.setItem(STORAGE_KEYS.token, data.token);
      }

      els.passwordInput.value = "";
      showApp();
      await loadBundle();
      setLoginMessage("Успішний вхід.", "success");
      showToast("Вхід успішний");
    } catch (error) {
      setLoginMessage(error.message || "Не вдалося увійти.", "error");
    } finally {
      setLoading(els.loginForm.querySelector("button[type='submit']"), false);
    }
  }

  async function tryRestoreSession() {
    try {
      const data = await apiRequest("/api/admin/session");
      if (data?.authenticated) {
        showApp();
        await loadBundle();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  async function handleSave() {
    try {
      syncStateFromDom();
      validateBundle(state.bundle);
      setLoading(els.saveButton, true, "Збереження...");

      await apiRequest("/api/admin/save", {
        method: "POST",
        json: {
          commitMessage: valueOf(els.commitMessage) || "admin: update content",
          site: state.bundle.site,
          categories: state.bundle.categories,
          menu: state.bundle.menu,
        },
      });

      showToast("Зміни закомічені в GitHub");
      await loadBundle();
    } catch (error) {
      showToast(error.message || "Не вдалося зберегти.");
    } finally {
      setLoading(els.saveButton, false);
    }
  }

  async function handleReload() {
    try {
      setLoading(els.reloadButton, true, "Оновлення...");
      await loadBundle();
      showToast("Контент оновлено з GitHub");
    } catch (error) {
      showToast(error.message || "Не вдалося оновити контент.");
    } finally {
      setLoading(els.reloadButton, false);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    state.authToken = "";
    sessionStorage.removeItem(STORAGE_KEYS.token);
    showLogin();
    showToast("Сесію завершено");
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Не вдалося прочитати файл."));
      reader.onload = () => {
        const result = String(reader.result || "");
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(input) {
    const file = input.files?.[0];
    if (!file) return;

    const card = input.closest('[data-entity="menu-item"]');
    if (!card) return;

    try {
      input.disabled = true;
      showToast("Завантаження картинки...");
      const base64 = await fileToBase64(file);
      const data = await apiRequest("/api/admin/upload-image", {
        method: "POST",
        json: {
          filename: file.name,
          contentType: file.type,
          folder: 'menu',
          commitMessage: valueOf(els.commitMessage) || `admin: upload ${file.name}`,
          base64,
        },
      });

      const imgField = $("[data-field='img']", card);
      const preview = $("[data-image-preview]", card);
      imgField.value = data.path;
      preview.innerHTML = `<img src="${escapeHtml(resolveAssetUrl(data.path))}" alt="Uploaded image" />`;
      showToast("Картинку завантажено в GitHub");
    } catch (error) {
      showToast(error.message || "Не вдалося завантажити картинку.");
    } finally {
      input.disabled = false;
      input.value = "";
    }
  }

  async function handleTestApi() {
    try {
      setLoading(els.testApiBaseButton, true, "Перевірка...");
      setApiBase(valueOf(els.apiBaseInput));
      const data = await apiRequest("/api/admin/health");
      setApiBaseMessage(`API OK: ${data.repo}@${data.branch}`, "success");
      showToast("API доступний");
    } catch (error) {
      setApiBaseMessage(error.message || "Не вдалося підключитися до API.", "error");
    } finally {
      setLoading(els.testApiBaseButton, false);
    }
  }

  function bindStaticEvents() {
    els.loginForm?.addEventListener("submit", handleLogin);
    els.saveButton?.addEventListener("click", handleSave);
    els.reloadButton?.addEventListener("click", handleReload);
    els.logoutButton?.addEventListener("click", handleLogout);
    els.saveApiBaseButton?.addEventListener("click", () => {
      setApiBase(valueOf(els.apiBaseInput));
      setApiBaseMessage(state.apiBase ? "API адресу збережено в цьому браузері." : "Використовується same-origin API.", "success");
    });
    els.testApiBaseButton?.addEventListener("click", handleTestApi);

    els.addMenuItemButton?.addEventListener("click", () => {
      syncStateFromDom();
      state.bundle.menu.push(defaultMenuItem());
      renderMenuEditor();
      updateStats();
      activateTab("menu");
    });

    els.addCategoryButton?.addEventListener("click", () => {
      syncStateFromDom();
      state.bundle.categories.push(defaultCategory());
      renderCategoriesEditor();
      renderMenuEditor();
      updateStats();
      activateTab("categories");
    });

    els.addTextKeyButton?.addEventListener("click", () => {
      syncStateFromDom();
      const entry = defaultTextEntry();
      state.bundle.site[entry.key] = entry.value;
      renderTextsEditor();
      updateStats();
      activateTab("texts");
    });

    $$(".tab").forEach((button) => {
      button.addEventListener("click", () => {
        syncStateFromDom();
        activateTab(button.dataset.tab);
      });
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      syncStateFromDom();

      const action = button.dataset.action;
      const index = Number(button.dataset.index);
      const key = button.dataset.key;

      if (action === "delete-menu-item") {
        state.bundle.menu.splice(index, 1);
        renderMenuEditor();
        updateStats();
      }

      if (action === "delete-category") {
        const category = state.bundle.categories[index];
        state.bundle.categories.splice(index, 1);
        if (category?.id) {
          const fallback = state.bundle.categories[0]?.id || "mains";
          state.bundle.menu = state.bundle.menu.map((item) =>
            item.cat === category.id ? { ...item, cat: fallback } : item,
          );
        }
        renderCategoriesEditor();
        renderMenuEditor();
        updateStats();
      }

      if (action === "delete-text" && key) {
        delete state.bundle.site[key];
        renderTextsEditor();
        updateStats();
      }
    });

    document.addEventListener("change", (event) => {
      const input = event.target;
      if (input.matches("[data-upload-input]")) handleImageUpload(input);
    });

    document.addEventListener("input", (event) => {
      const input = event.target;
      if (!input.matches("[data-field='img']")) return;
      const card = input.closest('[data-entity="menu-item"]');
      const preview = card ? $("[data-image-preview]", card) : null;
      if (!preview) return;
      const value = valueOf(input);
      preview.innerHTML = value
        ? `<img src="${escapeHtml(resolveAssetUrl(value))}" alt="Preview" />`
        : "<span>No image selected</span>";
    });
  }

  function init() {
    setApiBase(getInitialApiBase(), { persist: false });
    if (window.location.hostname.endsWith("github.io") && !state.apiBase) {
      setApiBaseMessage("Для GitHub Pages вкажи адресу Node API, наприклад https://your-admin-api.onrender.com", "error");
    }
    bindStaticEvents();
    tryRestoreSession();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
