/*CMD
  command: /add
  help: إضافة قناة أو رابط جديد للمراقبة
  need_reply: true
  auto_retry_time:
  folder:
  answer: 📌 أرسل الآن رابط أو معرّف القناة أو الموقع الذي تريد مراقبته (مثال: @KSU_News أو رابط RSS):
  keyboard:
  aliases: ➕ إضافة قناة أو رابط, إضافة مصدر
CMD*/

var ids = Bot.getProperty("admin_ids", [7607633343]) || [];
var allowed = false;
if (user) for (var i = 0; i < ids.length; i++) if (String(ids[i]) === String(user.telegramid)) allowed = true;
if (!allowed) { Bot.sendMessage("هذا الأمر مخصص للمشرف فقط."); return; }
Bot.sendMessage("لإضافة المصدر إلى وجهة صحيحة استخدم /add_source بالصيغة:\nUNIV_ID = @source twitter:@account\nلن يُحفظ مصدر بلا مشروع ولا تُختار أول قناة تلقائيًا.");
