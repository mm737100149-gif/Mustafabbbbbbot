/*CMD
  command: /set_ad
  help: تعديل نص الإعلان البديل
  need_reply: true
  auto_retry_time:
  folder:
  answer: ✏️ **أرسل الآن نص الإعلان البديل الجديد**:\n\n(اكتب النص بالكامل متضمناً رقمك أو معرفك @M_S_F_G، أو اكتب /cancel للإلغاء)
  keyboard:
  aliases:
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
Bot.sendMessage("أُوقفت الإعلانات البديلة نهائيًا من مسار النشر.");
