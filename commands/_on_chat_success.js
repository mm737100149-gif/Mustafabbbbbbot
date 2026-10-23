/*CMD
  command: /on_chat_success
  help: عرض إجابة المحادثة وحفظ سياقها لكل مستخدم
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var answer = "";
try {
  var data = JSON.parse(content);
  answer = String(data.choices[0].message.content || "").trim();
} catch (e) {}
if (!answer) { Bot.runCommand("/on_chat_error"); return; }
var query = User.getProperty("pending_chat_query", "");
var history = User.getProperty("ai_chat_history", []) || [];
history.push({ role: "user", content: query });
history.push({ role: "assistant", content: answer });
if (history.length > 12) history = history.slice(history.length - 12);
User.setProperty("ai_chat_history", history, "json");
User.setProperty("pending_chat_query", "", "string");
Bot.sendMessage(answer.substring(0, 3900));
