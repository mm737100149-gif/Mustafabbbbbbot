/*CMD
  command: /on_comment_ai_success
  help: نشر رد الذكاء على تعليق الطالب مع حفظ سياق خاص به
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var key = (params || "").trim();
var context = Bot.getProperty(key);
if (!key || !context) return;
var answer = "";
try {
  var data = JSON.parse(content);
  answer = String(data.choices[0].message.content || "").trim();
} catch (e) {}
if (!answer) {
  Bot.runCommand("/on_comment_ai_error " + key);
  return;
}
answer = answer.substring(0, 3900);
Api.sendMessage({ chat_id: context.chat_id, reply_to_message_id: context.message_id, text: answer, disable_web_page_preview: true });
var history = Bot.getProperty("comment_history_" + context.user_id, []) || [];
history.push({ role: "user", content: context.text });
history.push({ role: "assistant", content: answer });
if (history.length > 12) history = history.slice(history.length - 12);
Bot.setProperty("comment_history_" + context.user_id, history, "json");
Bot.setProperty(key, null, "json");
