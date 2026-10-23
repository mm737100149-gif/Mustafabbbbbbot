/*CMD
  command: /login_start
  help: ربط وتسجيل جلسة المستخدم المباشرة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: تسجيل دخول جديد, /login
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
Bot.sendMessage("لا يدعم هذا الإصدار تسجيل MTProto داخل Bots.Business. لن يطلب البوت رقم هاتف أو رمز تحقق أو كلمة مرور أو StringSession. استخدم المصادر العامة أو أضف البوت مشرفًا في القناة المصدر؛ أما القنوات الخاصة فتحتاج خدمة MTProto منفصلة وآمنة.");
