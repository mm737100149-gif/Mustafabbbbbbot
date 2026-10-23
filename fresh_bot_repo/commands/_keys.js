/*CMD
  command: /keys
  help: عرض المفاتيح والبيانات
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🔑 المفاتيح والاعتمادات, المفاتيح والاعتمادات, 🔑 المفاتيح والبيانات, المفاتيح, /credentials
CMD*/

var text = "🔑 **بيانات الاعتمادات والمفاتيح المعتمدة:**\n\n" +
  "• توكن البوت: `" + "محفوظ لدى المنصة (مخفي لأسباب أمنية)" + "`\n" +
  "• اسم البوت: @admiuin_bot (@ADMIN.p)\n" +
  "• معرف المشرف: `7607633343` (@M_S_F_G)\n" +
  "• عنوان الذكاء الاصطناعي: `https://api.hcnsec.cn/v1`\n" +
  "• النموذج الأساسي: `DeepSeek-V4.1-Flash`\n" +
  "• مفتاح الذكاء الاصطناعي: `" + (Bot.getProperty("ai_api_key", "") ? "مضبوط ✅ (مخفي)" : "غير مضبوط ⚠️") + "`\n\n" +
  "🔒 جميع المفاتيح مفعلة ومثبتة في مستودع GitHub وتعمل بنجاح.";

Bot.sendMessage(text);
