/*CMD
  command: /set_model
  help: تعيين نموذج الذكاء الاصطناعي النشط
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}


var new_model = params ? params.trim() : "";
if (!new_model) {
  Bot.sendMessage("⚠️ يرجى تحديد اسم النموذج المطلوب (مثال: `/set_model gpt-4o-mini`)");
  return;
}

Bot.setProperty("ai_model", new_model, "string");

var text = "✅ **تم بنجاح تغيير نموذج الذكاء الاصطناعي!**\n\n" +
  "• **النموذج الجديد المعتمد**: `" + new_model + "`\n" +
  "• **البوابة المستخدمة**: `https://api.openai.com/v1`\n" +
  "• سيتم استخدامه فورياً في كافة المنشورات التالية الموجهة لقنواتك.";

var inline_keyboard = [
  [
    { title: "⚡ فحص سرعة هذا النموذج الآن", command: "/api_test" }
  ],
  [
    { title: "⚙️ العودة لإعدادات الذكاء", command: "/ai" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
