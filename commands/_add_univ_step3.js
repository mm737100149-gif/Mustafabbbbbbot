/*CMD
  command: /add_univ_step3
  help: معالج الإضافة — مصادر تيليجرام
  need_reply: true
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

var wizard = User.getProperty("univ_wizard");
if (!wizard || wizard.step !== 3) { Bot.sendMessage("انتهت جلسة الإعداد. ابدأ من /add_university"); return; }
if (!message || message.trim() === "/cancel") { User.setProperty("univ_wizard", null, "json"); Bot.sendMessage("أُلغي المعالج."); return; }
wizard.telegram_sources = [];
if (!/^(?:تخطي|skip)$/i.test(message.trim())) {
  var tg = message.split(/[\s,;]+/);
  for (var i=0;i<tg.length;i++) if (tg[i]) wizard.telegram_sources.push(tg[i]);
}
wizard.step=4; User.setProperty("univ_wizard", wizard, "json");
Bot.sendMessage("أرسل حسابات X مفصولة بمسافات، أو اكتب تخطي.");
Bot.runCommand("/add_univ_step4");
