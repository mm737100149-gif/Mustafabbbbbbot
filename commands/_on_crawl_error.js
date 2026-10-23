/*CMD
  command: /on_crawl_error
  help: معالج الأخطاء الصامت عند فحص وسحب القنوات المصدر
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

// التنفيذ الدوري بلا محادثة؛ نحفظ الخطأ بدل إرسال رسالة إلى سياق غير موجود.
Bot.setProperty("last_crawl_error_" + String(params || "unknown"), {
  at: Date.now(), error: typeof content === "string" ? content.substring(0, 500) : "فشل طلب الجلب"
}, "json");
