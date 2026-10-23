/*CMD
  command: /handle_comment
  help: معالج الرد الذكي الآلي على تعليقات واستفسارات الطلاب في قنوات ومجموعات المناقشة V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (typeof request === "undefined" || !request || !request.message) return;

var msg = request.message;
var student_text = (msg.text || msg.caption || "").trim();
if (!student_text || student_text.length < 2) return;

// تجنب الرد على البوتات أو على رسائل البوت نفسه
if (msg.from && msg.from.is_bot) return;

var parent_post_text = "";
if (msg.reply_to_message) {
  parent_post_text = msg.reply_to_message.text || msg.reply_to_message.caption || "";
}

var chat_id = msg.chat.id;
var message_id = msg.message_id;
var user_name = msg.from ? (msg.from.first_name || msg.from.username || "عزيزي الطالب") : "عزيزي الطالب";

// سياق الرد
var ctx_id = "comment_" + chat_id + "_" + message_id;
Bot.setProperty(ctx_id, {
  chat_id: chat_id,
  message_id: message_id,
  user_name: user_name,
  student_text: student_text,
  parent_post: parent_post_text
}, "json");

var base_url = Bot.getProperty("ai_base_url") || "https://api.hcnsec.cn/v1";
var api_key = Bot.getProperty("ai_api_key") || "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii";
var current_model = Bot.getProperty("ai_model") || "DeepSeek-V4.1-Flash";

var system_prompt = "أنت المشرف والمساعد الأكاديمي الرسمي لقناة شؤون الطلاب.\n" +
  "قام أحد الطلاب بالتعليق أو الاستفسار عن المنشور الأكاديمي المرفق.\n" +
  "مهمتك:\n" +
  "1. أجب على استفساره بأسلوب أكاديمي رسمي، مهذب، ومشجع، ومباشر دون مقدمات طويلة\n" +
  "2. وضّح المواعيد أو الشروط أو الخطوات المطلوبة بدقة استناداً لمعلومات المنشور أو المعلومات الأكاديمية الرسمية\n" +
  "3. إذا كان الأمر يتطلب مراجعة عمادة القبول أو التسجيل أو البوابة الرسمية، وجّهه للبوابة أو شؤون الطلاب\n" +
  "4. لا تستخدم لغة عامية ولا تذكر أنك ذكاء اصطناعي، وتحدث بصفتك مشرف القناة الأكاديمية.";

var user_content = "سياق المنشور الأصلي في القناة:\n" + (parent_post_text || "إعلان أكاديمي رسمي") + "\n\n" +
  "تعليق/استفسار الطالب (" + user_name + "):\n" + student_text;

HTTP.post({
  url: base_url.replace(/\/+$/, "") + "/chat/completions",
  headers: {
    "Authorization": "Bearer " + api_key,
    "Content-Type": "application/json"
  },
  body: {
    model: current_model,
    messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: user_content }
    ],
    temperature: 0.25,
    max_tokens: 600
  },
  success: "/on_comment_ai_success " + ctx_id,
  error: "/on_comment_ai_error " + ctx_id,
  background: true
});
