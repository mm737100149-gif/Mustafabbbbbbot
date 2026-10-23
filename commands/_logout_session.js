/*CMD
  command: /logout_session
  help: تسجيل الخروج وحذف جلسة الـ UserBot
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
var keys=["userbot_session_active","userbot_session_phone","userbot_login_phone","userbot_login_otp","userbot_string_session","userbot_login_2fa","userbot_session_time","userbot_device_model"];for(var i=0;i<keys.length;i++)Bot.setProperty(keys[i],null,"json");Bot.sendMessage("مُسحت بيانات الجلسة القديمة المخزنة. لا توجد جلسة MTProto فعلية في هذا الإصدار.");
