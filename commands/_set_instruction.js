/*CMD
  command: /set_instruction
  help: تعديل تعليمات المشرف
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}


var raw = message || "";
var new_ins = raw.replace("/set_instruction", "").trim();
if (new_ins.length > 2) {
  Bot.setProperty("custom_instructions", new_ins, "string");
  Bot.sendMessage("✅ تم حفظ وتحديث تعليمات المشرف للمحرر بنجاح!");
} else {
  Bot.sendMessage("يرجى كتابة نص التعليمات بعد الأمر، مثال:\n`/set_instruction تعليماتك هنا`");
}
