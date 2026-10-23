/*CMD
  command: /reset_mapping
  help: منع إعادة الضبط المدمرة
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

Bot.sendMessage("لا توجد إعادة ضبط تلقائية تمحو الروابط. احذف مشروعًا محددًا من /del_mapping أو عدّله من /add_mapping.");
