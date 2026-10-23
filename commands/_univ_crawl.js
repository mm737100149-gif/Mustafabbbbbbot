/*CMD
  command: /univ_crawl
  help: فحص تيليجرام وX وجوجل لمشروع واحد
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

var id=(params||"").trim();if(!id){Bot.sendMessage("معرف المشروع مطلوب.");return;}Bot.runCommand("/crawl_sources "+id);
