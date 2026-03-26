import { json } from "@sveltejs/kit";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "$env/static/private";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const {
      accepted,
      herName,
      selectedDate,
      selectedTime,
      message,
      declineReason,
      declineMessage,
    } = await request.json();

    let text: string;

    if (accepted) {
      // валідація тільки для "так"
      if (!selectedDate || !selectedTime) {
        return json({ success: false, error: "Missing data" }, { status: 400 });
      }

      const dateFormatted = new Date(
        selectedDate + "T12:00:00",
      ).toLocaleDateString("uk-UA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      text =
        `🌹 <b>${herName ?? "Вона"} сказала ТАК!</b>\n\n` +
        `📅 <b>Дата:</b> ${dateFormatted}\n` +
        `🕐 <b>Час:</b> ${selectedTime}\n` +
        (message?.trim()
          ? `💌 <b>Слова для тебе:</b>\n${message}`
          : `💌 Без особих побажань ✨`) +
        `\n\n✨ Нехай цей вечір буде незабутнім!`;
    } else {
      // відмова — валідація тільки причини
      if (!declineReason) {
        return json(
          { success: false, error: "Missing reason" },
          { status: 400 },
        );
      }

      text =
        `🥀 <b>${herName ?? "Вона"} відповіла «ні»</b>\n\n` +
        `📌 <b>Причина:</b> ${declineReason}\n` +
        (declineMessage?.trim()
          ? `💬 <b>Її слова:</b>\n${declineMessage}`
          : `💬 Без додаткових коментарів`) +
        `\n\nАле запрошення було дуже красивим ❤️`;
    }

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      },
    );

    if (!tgRes.ok) {
      console.error("Telegram error:", await tgRes.text());
      return json({ success: false }, { status: 502 });
    }

    return json({ success: true });
  } catch (e) {
    console.error("Server error:", e);
    return json({ success: false }, { status: 500 });
  }
};
