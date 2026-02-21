(() => {
  if (window.App) return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function escapeHtml(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (s) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[s],
    );
  }

  function createToast(toastElOrSelector) {
    let timer = null;

    function resolveEl() {
      if (!toastElOrSelector) return null;
      if (typeof toastElOrSelector === "string") return $(toastElOrSelector);
      return toastElOrSelector;
    }

    function show(msg) {
      const toastEl = resolveEl();
      if (!toastEl) return;

      toastEl.textContent = msg;
      toastEl.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(() => toastEl.classList.remove("show"), 1600);
    }

    return { show };
  }

  window.App = { $, $$, escapeHtml, createToast };
})();
