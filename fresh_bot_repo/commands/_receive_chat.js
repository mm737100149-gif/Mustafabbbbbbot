/*CMD
  command: /receive_chat
  help: استقبال رسالة المستخدم ومعالجة التعليمات أو السؤال عبر الذكاء V4.0
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!message || message.trim() === "" || message.trim() === "/cancel") {
  Bot.sendMessage("تم إلغاء المحادثة والعودة للوحة الرئيسية ✅");
  Bot.runCommand("/start");
  return;
}

var raw_msg = message.trim();

// 1. فحص هل الرسالة عبارة عن تعليمات دائمة عبر "تعلم:"
if (raw_msg.indexOf("تعلم:") === 0) {
  var rule = raw_msg.replace(/^تعلم:\s*/, "").trim();
  if (rule) {
    var learned = Bot.getProperty("learned_instructions", []) || [];
    if (!Array.isArray(learned)) learned = [];
    if (learned.indexOf(rule) === -1) {
      learned.push(rule);
      Bot.setProperty("learned_instructions", learned, "json");
    }
    Bot.sendMessage("تم حفظ القاعدة في التعليمات الدائمة:\n" + rule);
    return;
  }
}

if (raw_msg === "نسيان السياق" || raw_msg === "/clear") {
  if (typeof User !== "undefined" && User.setProperty) {
    User.setProperty("chat_history", [], "json");
  }
  Bot.sendMessage("تم محو سياق المحادثة بنجاح ✅");
  return;
}

// 2. فحص هل الرسالة عبارة عن تعليمات عامة للمحرر
var is_instruction_command = false;
var new_instruction_text = "";

if (raw_msg.indexOf("تعليمات:") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg.replace("تعليمات:", "").trim();
} else if (raw_msg.indexOf("تعليمات ") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg.replace("تعليمات ", "").trim();
} else if (raw_msg.indexOf("اعتمد:") === 0 || raw_msg.indexOf("اعتمد ") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg.replace(/^اعتمد:?\s*/, "").trim();
} else if (raw_msg.indexOf("أريدك أن تركز") !== -1 || raw_msg.indexOf("كن مثل") !== -1 || raw_msg.indexOf("ركز على") === 0) {
  is_instruction_command = true;
  new_instruction_text = raw_msg;
}

if (is_instruction_command && new_instruction_text.length > 5) {
  Bot.setProperty("custom_instructions", new_instruction_text, "string");
  
  var success_text = "🎉 تم بنجاح تحديث واعتماد تعليمات المشرف الأكاديمية!\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    "📌 نص التعليمات الجديد المعتمد:\n" +
    "\"" + new_instruction_text + "\"\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "✅ تم حفظ وتثبيت التعليمات فوراً في النظام.\n" +
    "⚡ سيقوم الذكاء الاصطناعي بتطبيقها في كافة عمليات إعادة الصياغة والنشر القادمة.";

  var kb = [
    [
      { title: "💬 محادثة أخرى مع الذكاء", command: "/chat" },
      { title: "🧪 تجربة الصياغة بالتعليمات الجديدة", command: "/test" }
    ],
    [
      { title: "⚙️ إعدادات الذكاء الاصطناعي", command: "/ai" },
      { title: "🎛 اللوحة الرئيسية", command: "/start" }
    ]
  ];
  Bot.sendInlineKeyboard(kb, success_text);
  return;
}

// 3. معالجة السؤال أو الاستفسار عبر خادم الذكاء الاصطناعي
Bot.setProperty("last_user_query", raw_msg, "string");
if (typeof User !== "undefined" && User.setProperty) {
  User.setProperty("pending_chat_query", raw_msg, "string");
}
Bot.sendMessage("🔍 جاري معالجة استفسارك والبحث الأكاديمي المباشر:\n\"" + raw_msg + "\"");

var current_model = Bot.getProperty("ai_model") || "DeepSeek-V4.1-Flash";
var base_url = Bot.getProperty("ai_base_url") || "https://api.hcnsec.cn/v1";
var api_key = Bot.getProperty("ai_api_key") || "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii";
var saved_ins = Bot.getProperty("custom_instructions", "");
var learned_list = Bot.getProperty("learned_instructions", []) || [];

var system_chat_prompt = "أنت مساعد ومستشار أكاديمي خبير ومحرر محتوى رسمي لقنوات الجامعات.\n" +
  "تتحدث مع المشرف العام @" + (Bot.getProperty("admin_user", "M_S_F_G")) + ".\n" +
  "• تفهم وتجيب بطلاقة وبلاغة عربية فصيحة راقية عن أي سؤال أكاديمي (المكافآت والإعانات الاجتماعية، القبول الموحد، التقويم الجامعي، مواعيد الحذف والإضافة، الاختبارات النهائية، البوابات الإلكترونية، إلخ).\n" +
  "• تحدث بأسلوب مباشر، ذكي، مقنع، وخالٍ من الحشو أو الرموز المشوهة.\n" +
  "• إذا احتوت الرسالة على رابط، احتفظ به كاملاً ووضحه.";

if (saved_ins) {
  system_chat_prompt += "\nتعليمات المشرف المعتمدة: " + saved_ins;
}
if (learned_list && learned_list.length > 0) {
  system_chat_prompt += "\nالقواعد والتعليمات الدائمة: " + learned_list.join(" | ");
}

var messages_payload = [
  { role: "system", content: system_chat_prompt }
];

var user_history = (typeof User !== "undefined" && User.getProperty) ? (User.getProperty("chat_history", []) || []) : [];
for (var h = 0; h < user_history.length; h++) {
  messages_payload.push(user_history[h]);
}
messages_payload.push({ role: "user", content: raw_msg });

var endpoint_url = base_url.replace(/\/+$/, "") + "/chat/completions";

HTTP.post({
  url: endpoint_url,
  headers: {
    "Authorization": "Bearer " + api_key,
    "Content-Type": "application/json"
  },
  body: {
    model: current_model,
    messages: messages_payload,
    temperature: 0.3,
    max_tokens: 2400
  },
  success: "/on_chat_success",
  error: "/on_chat_error",
  background: true
});
