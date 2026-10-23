/*CMD
  command: /add_university
  help: معالج إضافة مشروع وقناة نشر — الخطوة الأولى
  need_reply: true
  auto_retry_time:
  folder:
  answer: أرسل قناة النشر الهدف، مثل @channel أو -1001234567890. أرسل /cancel للإلغاء.
  keyboard:
  aliases:
CMD*/

var adminIds = Bot.getProperty("admin_ids", [7607633343]) || [7607633343];
var isAdmin = false;
if (user) { for (var a = 0; a < adminIds.length; a++) if (String(adminIds[a]) === String(user.telegramid)) isAdmin = true; }
if (!isAdmin) { Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط."); return; }

if (!message || message.trim() === "/cancel") { Bot.sendMessage("أُلغي المعالج."); return; }
var channel = message.trim();
if (channel.indexOf("@") !== 0 && channel.indexOf("-100") !== 0) channel = "@" + channel;
if (!/^@[A-Za-z0-9_]{5,32}$/.test(channel) && !/^-100\d+$/.test(channel)) { Bot.sendMessage("معرف القناة غير صالح. أرسل @username أو معرفًا رقميًا يبدأ بـ -100."); Bot.runCommand("/add_university"); return; }
User.setProperty("univ_wizard", { step: 2, target_channel: channel }, "json");
Bot.sendMessage("تم حفظ القناة " + channel + "\nأرسل الآن الاسم الرسمي للجامعة أو الكلية، أو /cancel للإلغاء.");
Bot.runCommand("/add_univ_step2");
