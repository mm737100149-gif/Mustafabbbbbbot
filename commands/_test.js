/*CMD
  command: /test
  help: تجربة صياغة منشور أكاديمي فوري
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 🧪 تجربة الصياغة الفورية, 🧪 تجربة صياغة منشور, /demo
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
Bot.sendMessage("الفحص المحلي متاح في ملفات الاختبار، ولا يرسل هذا الأمر منشورًا تجريبيًا إلى قنواتك. الحالة الحالية: "+(Bot.getProperty("ai_api_key","")?"مفتاح الذكاء مضبوط":"مفتاح الذكاء غير مضبوط")+".");
