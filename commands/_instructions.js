/*CMD
  command: /instructions
  help: تعليمات المشرف للمحرر
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: ⚙️ تعليمات المحرر الأكاديمي, تعليمات المحرر الأكاديمي, ⚙️ تعليمات المحرر, تعليمات المحرر, التعليمات, /prompt
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}


var ins = Bot.getProperty("custom_instructions");
if (!ins) {
  ins = "كن مثل مشرفين القروبات الذي يبحث عن الأخبار الجديدة ويعطيها للطلاب بوضوح";
}

var text = "⚙️ **تعليمات المشرف الحالية للمحرر الذكي:**\n\n" +
  "📌 *\"" + ins + "\"*\n\n" +
  "✏️ لتعديل التعليمات أرسل: `/set_instruction تعليماتك الجديدة هنا`";

Bot.sendMessage(text);
