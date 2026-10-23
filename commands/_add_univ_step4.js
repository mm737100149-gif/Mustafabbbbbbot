/*CMD
  command: /add_univ_step4
  help: معالج الإضافة — حسابات X
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
if (!wizard || wizard.step !== 4) { Bot.sendMessage("انتهت جلسة الإعداد. ابدأ من /add_university"); return; }
if (!message || message.trim() === "/cancel") { User.setProperty("univ_wizard", null, "json"); Bot.sendMessage("أُلغي المعالج."); return; }
wizard.twitter_sources=[];
if (!/^(?:تخطي|skip)$/i.test(message.trim())) {
  var tw=message.split(/[\s,;]+/);
  for (var i=0;i<tw.length;i++) if (tw[i]) wizard.twitter_sources.push(tw[i]);
}
wizard.step=5; User.setProperty("univ_wizard",wizard,"json");
Bot.sendMessage("أرسل استعلام Google News، أو اكتب تلقائي لاستخدام اسم الجامعة، أو تخطي لتعطيله.");
Bot.runCommand("/add_univ_step5");
