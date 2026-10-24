/*CMD
  command: /comments
  help: ضبط مجموعة المناقشة المرتبطة بالقناة للرد على التعليقات
  need_reply: true
  auto_retry_time:
  folder:
  answer: أرسل المعرف الرقمي لمجموعة المناقشة (مثل -1001234567890)، أو أرسل إيقاف لتعطيل الردود. يجب إضافة البوت إلى المجموعة ومنحه قراءة الرسائل والرد.
  keyboard:
  aliases: 💬 إعداد الرد على التعليقات
CMD*/

if (!user || String(user.telegramid) !== String(Bot.getProperty("admin_id", 7607633343))) {
  Bot.sendMessage("⛔ هذا الإعداد متاح للمشرف فقط.");
  return;
}
var value = String(message || "").trim();
if (value === "إيقاف" || value.toLowerCase() === "off") {
  Bot.setProperty("comments_enabled", false, "boolean");
  Bot.sendMessage("تم تعطيل الرد على التعليقات.");
  return;
}
if (!/^-100\d{10,}$/.test(value) && !/^-\d{5,}$/.test(value)) {
  Bot.sendMessage("معرف المجموعة غير صالح. أرسل المعرف الرقمي الذي يبدأ عادة بـ -100، أو أرسل إيقاف.");
  Bot.run({ command: "/comments" });
  return;
}
Bot.setProperty("comments_group_id", value, "string");
Bot.setProperty("comments_enabled", true, "boolean");
Bot.sendMessage("✅ تم ضبط مجموعة المناقشة وتفعيل الردود.\nأضف البوت إلى المجموعة وامنحه قراءة الرسائل. الردود على التعليقات تتطلب اتصالًا بالإنترنت وخدمة ذكاء مضبوطة.");
