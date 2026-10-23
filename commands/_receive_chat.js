/*CMD
  command: /receive_chat
  help: استقبال سياق المحادثة والتعليمات لكل مشرف
  need_reply: true
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var adminIds = Bot.getProperty("admin_ids", [Bot.getProperty("admin_id", 7607633343)]) || [];
var chatAllowed = false;
if (user) for (var a = 0; a < adminIds.length; a++) if (String(user.telegramid) === String(adminIds[a])) chatAllowed = true;
if (!chatAllowed) return;
var raw = String(message || "").trim();
if (!raw || raw === "/cancel") { Bot.sendMessage("تم إنهاء المحادثة."); return; }
if (raw === "نسيان السياق") {
  User.setProperty("ai_chat_history", [], "json");
  Bot.sendMessage("تم محو سياق المحادثة فقط؛ التعليمات الدائمة لم تتغير.");
  return;
}
if (/^(?:تعلم|تعليمات|اعتمد)\s*:/.test(raw)) {
  var instruction = raw.replace(/^(?:تعلم|تعليمات|اعتمد)\s*:/, "").trim();
  if (instruction.length < 4 || instruction.length > 1200) { Bot.sendMessage("التعليمات يجب أن تكون بين 4 و1200 حرف."); return; }
  if (/^تعلم\s*:/.test(raw)) {
    var learned = Bot.getProperty("learned_instructions", []) || [];
    if (learned.indexOf(instruction) === -1) learned.push(instruction);
    if (learned.length > 12) learned = learned.slice(learned.length - 12);
    Bot.setProperty("learned_instructions", learned, "json");
  } else {
    Bot.setProperty("custom_instruction", instruction, "string");
  }
  Bot.sendMessage("✅ حُفظت التعليمات في خصائص البوت وستُستخدم في الصياغات القادمة. لم يُعدّل المستودع تلقائيًا.");
  return;
}

var apiKey = Bot.getProperty("ai_api_key", "");
if (!apiKey) { Bot.sendMessage("خدمة المحادثة غير مضبوطة. أضف مفتاح API أولًا من /set_api_key."); return; }
var history = User.getProperty("ai_chat_history", []) || [];
User.setProperty("pending_chat_query", raw, "string");
var messages = [{ role: "system", content:
  "أنت مساعد عربي للمشرف الأكاديمي. ناقش بحرية وبدقة واختصار مناسب. لا تدّعِ إجراء بحث ويب ولا تخترع مواعيد أو أرقامًا أو سياسات. " +
  "ميّز بوضوح بين المعلومة المؤكدة والمعرفة العامة وما يحتاج مراجعة المصدر الرسمي. لا تستخدم قوالب مجاملة أو مقدمات جاهزة." }];
var custom = Bot.getProperty("custom_instruction", Bot.getProperty("custom_instructions", ""));
if (custom) messages[0].content += "\nتعليمات المشرف للتحرير: " + custom;
for (var i = 0; i < history.length; i++) messages.push(history[i]);
messages.push({ role: "user", content: raw });
HTTP.post({
  url: Bot.getProperty("ai_base_url", "https://api.openai.com/v1").replace(/\/+$/, "") + "/chat/completions",
  headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
  body: { model: Bot.getProperty("ai_model", "gpt-4o-mini"), messages: messages, temperature: 0.25, max_tokens: 1400 },
  success: "/on_chat_success", error: "/on_chat_error", background: true
});
