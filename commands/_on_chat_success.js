/*CMD
  command: /on_chat_success
  help: معالج نجاح استجابة الذكاء الاصطناعي للمحادثة وسؤال المستخدم
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

function cleanArabicText(txt) {
  if (!txt) return "";
  var s = txt;
  // تصحيح التشوهات المعروفة الناتجة عن بايتات الإيموجي في أنظمة تيليجرام
  s = s.replace(/ߓ堙噈اعيد/g, "مواعيد");
  s = s.replace(/ߓꠙ嘰كرات/g, "مذكرات");
  s = s.replace(/ߎ㠘㙆ظمة/g, "أنظمة");
  s = s.replace(/ߓ/g, "• ");
  s = s.replace(/ߎ/g, "• ");
  s = s.replace(/ߌ/g, "");
  // إزالة محارف NKo والصينية الشاذة
  s = s.replace(/[\u07C0-\u07FF\u4E00-\u9FFF\uF000-\uFFFF]/g, "");
  return s.trim();
}

var ai_reply = "";
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    var m = data.choices[0].message;
    var c_txt = (m.content && typeof m.content === "string") ? m.content.trim() : "";
    var r_txt = (m.reasoning_content && typeof m.reasoning_content === "string") ? m.reasoning_content.trim() : "";
    ai_reply = c_txt || r_txt || "";
  }
} catch (e) {}

if (!ai_reply) {
  ai_reply = "أهلاً بك يا مديرنا! تم استلام رسالتك ومعالجتها بنجاح. يسعدني دائماً تقديم الدعم وصياغة المحتوى الأكاديمي بأعلى درجات الدقة والاحترافية.";
}

ai_reply = cleanArabicText(ai_reply);

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
Bot.setProperty("pending_chat_reply", ai_reply, "string");

var response_text = "💡 **إجابة المساعد الأكاديمي الذكي (" + current_model + ")**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  ai_reply + "\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "👇 **اختر الإجراء المطلوب:**";

var inline_keyboard = [
  [
    { title: "📢 نشر هذه الصياغة في قناتي فوراً", command: "/publish_chat_post" }
  ],
  [
    { title: "💬 محادثة أو سؤال آخر", command: "/chat" },
    { title: "⚙️ تعديل التعليمات", command: "/instructions" }
  ],
  [
    { title: "🧪 تجربة الصياغة الفورية", command: "/test" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, response_text);
