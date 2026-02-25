import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  try {
    const payload = await req.json();

    const {
      formType = "reserve",
      lang = "ja",

      // shared
      name = "",
      phone = "",

      // reserve fields
      date = "",
      time = "",
      people = "",
      note = "",

      // mail fields
      subject = "",
      message = "",
    } = payload ?? {};

    const isMailForm = formType === "mail";

    // ✅ РОЗДІЛЕНА ВАЛІДАЦІЯ
    if (isMailForm) {
      if (!name || !phone || !subject || !message) {
        return json({ ok: false, error: "missing_required_fields_mail" }, 400);
      }
    } else {
      if (!name || !phone || !date || !time || !people) {
        return json(
          { ok: false, error: "missing_required_fields_reserve" },
          400,
        );
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const toEmail = Deno.env.get("TO_EMAIL");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";

    if (!resendApiKey || !toEmail) {
      return json({ ok: false, error: "missing_server_secrets" }, 500);
    }

    const emailSubject = isMailForm
      ? `📩 Повідомлення з сайту (${lang}) — ${subject || "Без теми"}`
      : `📅 Нове бронювання (${lang}) — ${name}`;

    const text = isMailForm
      ? [
          "Нове повідомлення з сайту",
          "",
          `Мова сайту: ${lang}`,
          `Ім'я: ${name}`,
          `Телефон: ${phone}`,
          `Тема: ${subject || "-"}`,
          `Повідомлення: ${message || "-"}`,
        ].join("\n")
      : [
          "Нове бронювання",
          "",
          `Мова сайту: ${lang}`,
          `Ім'я: ${name}`,
          `Телефон: ${phone}`,
          `Дата: ${date || "-"}`,
          `Час: ${time || "-"}`,
          `Кількість гостей: ${people || "-"}`,
          `Коментар: ${note || "-"}`,
        ].join("\n");

    const html = isMailForm
      ? `
        <h2>Нове повідомлення з сайту</h2>
        <p><b>Мова сайту:</b> ${esc(lang)}</p>
        <p><b>Ім'я:</b> ${esc(name)}</p>
        <p><b>Телефон:</b> ${esc(phone)}</p>
        <p><b>Тема:</b> ${esc(subject || "-")}</p>
        <p><b>Повідомлення:</b><br>${esc(message || "-").replaceAll("\n", "<br>")}</p>
      `
      : `
        <h2>Нове бронювання</h2>
        <p><b>Мова сайту:</b> ${esc(lang)}</p>
        <p><b>Ім'я:</b> ${esc(name)}</p>
        <p><b>Телефон:</b> ${esc(phone)}</p>
        <p><b>Дата:</b> ${esc(date || "-")}</p>
        <p><b>Час:</b> ${esc(time || "-")}</p>
        <p><b>Кількість гостей:</b> ${esc(people || "-")}</p>
        <p><b>Коментар:</b><br>${esc(note || "-").replaceAll("\n", "<br>")}</p>
      `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Colibri House <${fromEmail}>`,
        to: [toEmail],
        subject: emailSubject,
        html,
        text,
      }),
    });

    const resendJson = await resendRes.json().catch(() => null);

    if (!resendRes.ok) {
      console.error("Resend error:", resendJson);
      return json(
        { ok: false, error: "email_send_failed", details: resendJson },
        502,
      );
    }

    return json({
      ok: true,
      mode: formType,
      emailId: resendJson?.id ?? null,
    });
  } catch (err) {
    console.error("Function error:", err);
    return json({ ok: false, error: "server_error" }, 500);
  }
});