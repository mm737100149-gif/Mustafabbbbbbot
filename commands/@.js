/*CMD
  command: @
  help: المعالج الشامل اللحظي لكافة الرسائل والوسائط والمنشورات الواردة V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

// إذا كانت الرسالة أمراً محدداً يبدأ بـ /، نترك Bots.Business ينفذه بشكل طبيعي
if (typeof message !== "undefined" && message && message.indexOf("/") === 0) {
  return;
}

// توجيه الرسائل العادية والوسائط والتوجيهات إلى الموجه الشامل
Bot.runCommand("_default");
