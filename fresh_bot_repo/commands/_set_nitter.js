/*CMD
  command: /set_nitter
  help: ضبط خادم Nitter المستقر لسحب تغريدات تويتر/X (مثال: nitter.poast.org أو خادمك الخاص)
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 🐦 **ضبط خادم Nitter لسحب تويتر/X**:\n\nأرسل اسم الخادم فقط بدون https (مثال: `nitter.poast.org`)\nأو أرسل عدة خوادم مفصولة بفاصلة للتراجع التلقائي.\n\n*(أرسل /cancel للإلغاء)*
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() == "/cancel") {
  Bot.sendMessage("تم الإلغاء ✅");
  Bot.runCommand("/start");
  return;
}

var inst = message.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/\/rss$/, "");
if (inst.length < 4 || inst.indexOf(" ") !== -1) {
  Bot.sendMessage("❌ اسم خادم غير صالح. مثال صحيح: `nitter.poast.org`");
  Bot.run({ command: "/set_nitter" });
  return;
}

Bot.setProperty("nitter_instances", inst, "string");
Bot.setProperty("nitter_instance", inst.split(",")[0].trim(), "string");

Bot.sendMessage("✅ **تم ضبط خوادم Nitter بنجاح:** `" + inst + "`\n" +
  "سيستخدمها البوت بالترتيب مع التراجع التلقائي عند فشل أي خادم.\n" +
  "جرّب الآن: /crawl_sources");
