/*CMD
  command: /set_channel
  help: إرشادات قنوات النشر دون محو الروابط
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var adminIds = Bot.getProperty("admin_ids", [7607633343]) || [7607633343];
var isAdmin = false;
if (user) { for (var a = 0; a < adminIds.length; a++) if (String(adminIds[a]) === String(user.telegramid)) isAdmin = true; }
if (!isAdmin) { Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط."); return; }

Bot.sendMessage("لتغيير قناة مشروع دون حذف بقية المشاريع استخدم /add_mapping أو معالج /add_university.\nلا يغيّر هذا الأمر الروابط الحالية تلقائيًا؛ لكل مشروع قناة مستقلة في /mapping.");Bot.runCommand("/mapping");
