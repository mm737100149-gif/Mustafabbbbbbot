/*CMD
  command: /chat
  help: محادثة مفتوحة مع الذكاء وتعليمه تعليمات دائمة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 💬 محادثة الذكاء الاصطناعي, محادثة الذكاء, /ask, /ai_chat
CMD*/

if (!user || String(user.telegramid) !== String(Bot.getProperty("admin_id", 7607633343))) {
  Bot.sendMessage("⛔ لوحة المحادثة والتعليم متاحة للمشرف فقط.");
  return;
}
Bot.sendMessage("💬 أرسل سؤالك أو ملاحظتك. تحفظ المحادثة آخر 12 رسالة لسياقك أنت فقط.\nلتعليم المحرر قاعدة دائمة اكتب: تعلم: ثم القاعدة.\nللمحو اكتب: نسيان السياق. للإلغاء: /cancel\nملاحظة: هذه المحادثة لا تجري بحثًا حيًا في الويب ولا تؤكد المواعيد الرسمية من تلقاء نفسها.");
Bot.run({ command: "/receive_chat" });
