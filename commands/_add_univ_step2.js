/*CMD
  command: /add_univ_step2
  help: معالج الإضافة — اسم الجامعة
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
if (!wizard || wizard.step !== 2) { Bot.sendMessage("انتهت جلسة الإعداد. ابدأ من /add_university"); return; }
if (!message || message.trim() === "/cancel") { User.setProperty("univ_wizard", null, "json"); Bot.sendMessage("أُلغي المعالج."); return; }
var name = message.trim();
if (name.length < 3) { Bot.sendMessage("الاسم قصير جدًا. أرسل اسمًا واضحًا."); Bot.runCommand("/add_univ_step2"); return; }
wizard.name = name; wizard.step = 3; User.setProperty("univ_wizard", wizard, "json");
Bot.sendMessage("أرسل قنوات تيليجرام المصدر مفصولة بمسافات، أو اكتب تخطي.");
Bot.runCommand("/add_univ_step3");
