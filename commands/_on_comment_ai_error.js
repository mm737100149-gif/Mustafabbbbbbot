/*CMD
  command: /on_comment_ai_error
  help: المعالج الاحتياطي الذكي عند تعذر استجابة الذكاء على التعليقات V4.0
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

var fallback_reply = "أهلاً بك! يرجى مراجعة التقويم الجامعي أو بوابة عمادة القبول والتسجيل الرسمية للتأكد من تفاصيل المواعيد والإجراءات المعتمدة، وسيقوم المشرف بالرد عليك إذا استدعى الأمر.";

try {
  Api.sendMessage({
    chat_id: ctx.chat_id,
    reply_to_message_id: ctx.message_id,
    text: fallback_reply
  });
} catch (err) {}

Bot.setProperty(ctx_id, null, "json");
