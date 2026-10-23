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

var ids=Bot.getProperty("admin_ids",[7607633343])||[7607633343],ok=false;if(user){for(var i=0;i<ids.length;i++)if(String(ids[i])===String(user.telegramid))ok=true;}if(!ok){Bot.sendMessage("هذا الأمر مخصص للمشرف فقط.");return;}
Bot.sendMessage("🔑 حالة الاعتمادات\nتوكن تيليجرام: تديره منصة Bots.Business ولا يظهر هنا.\nمفتاح الذكاء: "+(Bot.getProperty("ai_api_key","")?"مضبوط ومخفي":"غير مضبوط")+"\nلا تُخزن الأسرار في GitHub ولا ترسل OTP أو 2FA أو StringSession.");
