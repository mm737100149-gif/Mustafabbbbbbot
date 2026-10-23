/*CMD
  command: /on_chat_error
  help: رسالة خطأ صادقة للمحادثة دون إجابات مختلقة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

User.setProperty("pending_chat_query", "", "string");
Bot.sendMessage("تعذر الحصول على إجابة لأن خدمة الذكاء الاصطناعي لم تستجب بنجاح. لم أولّد إجابة بديلة حتى لا أقدم معلومات مختلقة. حاول لاحقًا أو افحص /api_test.");
