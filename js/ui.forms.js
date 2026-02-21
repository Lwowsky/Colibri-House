(() => {
  const App = window.App;
  const I18n = window.AppI18n;
  if (!App || !I18n) return;

  const { $, createToast } = App;
  const { getDict } = I18n;

  let toast = null;

  function ensureToast() {
    if (toast) return toast;
    const node = $("#toast");
    if (!node) return null;
    toast = createToast(node);
    return toast;
  }

  function showToast(msg) {
    const t = ensureToast();
    if (t) t.show(msg);
  }

  function isHoneypotTripped(form) {
    const gotcha = form?.querySelector('input[name="_gotcha"]');
    return !!(
      gotcha &&
      typeof gotcha.value === "string" &&
      gotcha.value.trim() !== ""
    );
  }

  function syncFormLang() {
    const lang = document.documentElement.lang || "ja";
    $("#formLang")?.setAttribute("value", lang);
  }

  async function sendFormspree(
    form,
    { onSuccess, onError, beforeSend, afterSend } = {},
  ) {
    const url = form?.action;
    if (!url) return;

    if (isHoneypotTripped(form)) return;

    try {
      beforeSend?.();

      const res = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (!res.ok) throw new Error("send_failed");
      onSuccess?.();
    } catch {
      onError?.();
    } finally {
      afterSend?.();
    }
  }

  function initReserveFormOnce() {
    const form = $("#reserveForm");
    if (!form) return;
    if (form.dataset.inited === "1") return;
    form.dataset.inited = "1";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const timeHidden = form.querySelector("#timeHidden");

      if (!timeHidden?.value) {
        showToast("Оберіть час (17:00–22:00)");
        return;
      }

      await sendFormspree(form, {
        beforeSend: () => submitBtn?.setAttribute("disabled", "disabled"),
        afterSend: () => submitBtn?.removeAttribute("disabled"),
        onSuccess: () => {
          form.reset();
          document.dispatchEvent(new CustomEvent("app:reserve-sent"));
        },
        onError: () => {
          showToast(
            getDict()?.toast_failed || "Помилка відправки. Спробуйте ще раз.",
          );
        },
      });
    });
  }

  function initMailFormOnce() {
    const form = $("#mailForm");
    if (!form) return;
    if (form.dataset.inited === "1") return;
    form.dataset.inited = "1";

    const submitBtn = form.querySelector('button[type="submit"]');
    const mailHint = $("#mailHint");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      await sendFormspree(form, {
        beforeSend: () => submitBtn?.setAttribute("disabled", "disabled"),
        afterSend: () => submitBtn?.removeAttribute("disabled"),
        onSuccess: () => {
          form.reset();
          document.dispatchEvent(new CustomEvent("app:mail-sent"));
        },
        onError: () => {
          if (mailHint) {
            mailHint.style.display = "block";
            mailHint.textContent =
              "Не вдалося надіслати. Спробуйте ще раз або використайте mailto.";
          } else {
            showToast(getDict()?.toast_failed || "Send failed. Try again.");
          }
        },
      });
    });
  }

  function initAll() {
    ensureToast();
    syncFormLang();
    initReserveFormOnce();
    initMailFormOnce();
  }

  document.addEventListener("app:lang-changed", syncFormLang);
  document.addEventListener("DOMContentLoaded", initAll);
  document.body.addEventListener("htmx:load", initAll);
})();
