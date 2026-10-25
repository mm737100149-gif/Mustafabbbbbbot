/*CMD
  command: /keys
  help: عرض المفاتيح والبيانات المعتمدة ومستودع GitHub
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🔑 المفاتيح والاعتمادات, المفاتيح والاعتمادات, 🔑 المفاتيح والبيانات, المفاتيح, /credentials
CMD*/

var current_token = Bot.getProperty("bot_token") || "8812285802:AAGJ7zXy_JUVmBY2QddqbT_NSrmTe_XZY5U";
var current_user = Bot.getProperty("bot_username") || "Jsjsjjjnxnbot";

var text = "🔑 **بيانات الاعتمادات والمفاتيح المعتمدة:**\n\n" +
  "• توكن البوت: `" + current_token + "`\n" +
  "• اسم ومعرف البوت: @" + current_user + " (ID: 8812285802)\n" +
  "• مستودع GitHub المربوط: `https://github.com/mm737100149-gif/Bot.git`\n" +
  "• معرف المشرف العام: `7607633343` (@M_S_F_G)\n" +
  "• عنوان الذكاء الاصطناعي: `https://api.hcnsec.cn/v1`\n" +
  "• النموذج الأكاديمي الأساسي: `DeepSeek-V4.1-Flash`\n" +
  "• مفتاح الذكاء الاصطناعي: `sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii`\n" +
  "• القناة المستهدفة الافتراضية: `@jhdhhdcj`\n\n" +
  "🔒 جميع المفاتيح مفعلة ومثبتة رسمياً وتعمل بالنظام التلقائي 24/7 دون توقف.";

Bot.sendMessage(text);
