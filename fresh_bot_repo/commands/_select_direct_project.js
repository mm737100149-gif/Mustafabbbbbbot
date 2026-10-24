/*CMD
  command: /select_direct_project
  help: اختيار وجهة المنشور اليدوي دون افتراض قناة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if (!user || String(user.telegramid) !== String(Bot.getProperty("admin_id", 7607633343))) return;
var id = (params || "").trim();
var pending = User.getProperty("pending_direct_post");
if (!id || !pending) { Bot.sendMessage("لا يوجد منشور محفوظ للاختيار. أعد إرسال المنشور."); return; }
var projects = Bot.getProperty("university_projects", []) || [];
for (var i = 0; i < projects.length; i++) {
  if (projects[i].id === id && projects[i].enabled !== false) {
    User.setProperty("pending_direct_post", null, "json");
    Bot.runCommand("/submit_post", {
      university_id: id, source_type: "direct", source_id: "direct:" + user.telegramid,
      source_post_id: pending.source_post_id, raw_text: pending.text,
      media: pending.media || [], notify: true
    });
    return;
  }
}
Bot.sendMessage("المشروع المختار غير موجود أو معطل.");
