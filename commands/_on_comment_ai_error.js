/*CMD
  command: /on_comment_ai_error
  help: إبلاغ صادق عند تعذر الرد على التعليق
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var key = (params || "").trim();
var context = Bot.getProperty(key);
if (!context) return;
Api.sendMessage({ chat_id: context.chat_id, reply_to_message_id: context.message_id,
  text: "تعذر الحصول على إجابة موثوقة الآن بسبب فشل الاتصال بخدمة الذكاء الاصطناعي. حاول لاحقًا أو راجع المصدر الرسمي." });
Bot.setProperty(key, null, "json");
