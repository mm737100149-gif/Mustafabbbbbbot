/*CMD
  command: /check_session
  help: فحص حالة جلسة الـ UserBot وبصمة الجهاز
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
Bot.sendMessage("لا توجد جلسة MTProto نشطة داخل Bots.Business. أي إعداد قديم يدّعي ذلك كان غير صالح.");
