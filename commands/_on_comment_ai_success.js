/*CMD
  command: /on_comment_ai_success
  help: نشر رد المشرف الأكاديمي على تعليق الطالب في مجموعة المناقشة V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var ctx_id = (params || "").trim();
var ctx = ctx_id ? Bot.getProperty(ctx_id) : null;
if (!ctx) return;

var answer = "";
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    answer = data.choices[0].message.content.trim();
  }
} catch (e) {}

if (!answer) {
  Bot.runCommand("/on_comment_ai_error " + ctx_id);
  return;
}

// تنظيف الرد من أي علامات غير لائقة
answer = answer.replace(/^(الرد:|الإجابة:)\s*/i, "").trim();

try {
  Api.sendMessage({
    chat_id: ctx.chat_id,
    reply_to_message_id: ctx.message_id,
    text: answer
  });
} catch (err) {}

// حفظ سياق صاحب التعليق
var uid = ctx.user_id || (ctx.from && ctx.from.id);
if (uid) {
  var user_text = ctx.text || ctx.student_text || "";
  var historyKey = "comment_history_" + uid;
  var history = Bot.getProperty(historyKey, []) || [];
  history.push({ role: "user", content: user_text });
  history.push({ role: "assistant", content: answer });
  if (history.length > 20) history = history.slice(history.length - 20);
  Bot.setProperty(historyKey, history, "json");
}

// تنظيف السياق
Bot.setProperty(ctx_id, null, "json");
