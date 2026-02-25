(() => {
  const App = window.App;
  const I18n = window.AppI18n;
  if (!App || !I18n) return;

  const { $, createToast } = App;
  const { getDict } = I18n;

  const SUPABASE_FN_URL =
    "https://gpuutpvuxtfdtqlewctc.functions.supabase.co/reserve";

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

  function formToObject(form) {
    const fd = new FormData(form);
    const data = {};

    for (const [key, value] of fd.entries()) {
      if (key === "_gotcha") continue; // honeypot не відправляємо
      data[key] = typeof value === "string" ? value.trim() : value;
    }

    // мова сайту
    data.lang = document.documentElement.lang || "ja";

    // тип форми
    data.formType = form?.id === "mailForm" ? "mail" : "reserve";

    return data;
  }

  async function sendToSupabase(
    form,
    { onSuccess, onError, beforeSend, afterSend } = {},
  ) {
    if (!form) return;
    if (isHoneypotTripped(form)) return;

    try {
      beforeSend?.();

      const payload = formToObject(form);

      const res = await fetch(SUPABASE_FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok || (json && json.ok === false)) {
        throw new Error("send_failed");
      }

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

      await sendToSupabase(form, {
        beforeSend: () => submitBtn?.setAttribute("disabled", "disabled"),
        afterSend: () => submitBtn?.removeAttribute("disabled"),
        onSuccess: () => {
          form.reset();

          // якщо в тебе кастомний time select — чистимо вручну
          const timeInput = form.querySelector("#timeInput");
          const timeHiddenLocal = form.querySelector("#timeHidden");
          if (timeInput) timeInput.value = "";
          if (timeHiddenLocal) timeHiddenLocal.value = "";

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

      await sendToSupabase(form, {
        beforeSend: () => submitBtn?.setAttribute("disabled", "disabled"),
        afterSend: () => submitBtn?.removeAttribute("disabled"),
        onSuccess: () => {
          if (mailHint) mailHint.style.display = "none";
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
    initReserveFormOnce();
    initMailFormOnce();
  }

  document.addEventListener("DOMContentLoaded", initAll);
  document.body.addEventListener("htmx:load", initAll);
})();