/*CMD
  command: /set_source_profile
  help: حفظ وصف دائم لمصادر جامعة ليفهم المحرر سياقها
  need_reply: true
  auto_retry_time:
  folder:
  answer: أرسل وصف المصدر وطبيعة محتواه، مثل: القناة الرسمية لعمادة القبول؛ تنشر المواعيد والروابط والتعاميم. يجب استدعاء الأمر هكذا أولًا: /set_source_profile UNIV_ID
  keyboard:
  aliases:
CMD*/

if (!user || String(user.telegramid) !== String(Bot.getProperty("admin_id", 7607633343))) return;
var universityId = (params || "").trim();
var description = String(message || "").trim();
if (!universityId || !description || description.indexOf("/set_source_profile") === 0) {
  Bot.sendMessage("الصيغة: /set_source_profile UNIV_ID ثم أرسل وصف المصدر.");
  return;
}
var projects = Bot.getProperty("university_projects", []) || [];
for (var i = 0; i < projects.length; i++) {
  if (projects[i].id === universityId) {
    projects[i].source_profile = description.substring(0, 1500);
    Bot.setProperty("university_projects", projects, "json");
    Bot.sendMessage("✅ حُفظ وصف مصادر " + projects[i].name + "، وسيُرسل كسياق للمحرر دون استخدامه لحذف المواعيد.");
    return;
  }
}
Bot.sendMessage("معرف الجامعة غير موجود.");
