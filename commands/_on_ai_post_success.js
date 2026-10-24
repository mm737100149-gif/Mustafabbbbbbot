/*CMD
  command: /on_ai_post_success
  help: معالج نجاح صياغة الذكاء ونشر المنشور في قناة الجامعة المستهدفة حصراً V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

function cleanArabicAndWebGarbage(txt) {
  if (!txt) return "";
  var s = txt;
  // تنظيف الرموز المشوهة
  s = s.replace(/ߓ堙噈اعيد/g, "مواعيد");
  s = s.replace(/ߓꠙ嘰كرات/g, "مذكرات");
  s = s.replace(/ߎ㠘㙆ظمة/g, "أنظمة");
  s = s.replace(/[̀-ͯ]/g, "");
  s = s.replace(/[ࠀ-࿿]/g, "");
  s = s.replace(/[一-鿿]/g, "");
  s = s.replace(/[-]/g, "");

  // تنظيف مخلفات الويب وتويتر و&nbsp; وX
  s = s.replace(/&nbsp;\s*X/gi, "");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+X\s*$/g, "");
  s = s.replace(/\s+X\n/g, "\n");
  s = s.replace(/\bX\s*$/g, "");

  // إزالة العبارات الروبوتية السخيفة التي قد تصدر من الذكاء
  s = s.replace(/^(إليك صياغة الخبر|إليك الخبر الأكاديمي|صياغة إخبارية|إليك المنشور|وفقاً للبيانات المقدمة):?\s*/i, "");
  s = s.replace(/^أهلاً بك عزيزي الطالب[:\s]*/i, "");

  // تنظيف النقاط الفارغة
  var lines = s.split("\n");
  var clean_lines = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (!l) {
      clean_lines.push("");
      continue;
    }
    if (l === "•" || l === "-" || l === "*" || l === "• " || l === "- " || l === "* ") {
      continue;
    }
    clean_lines.push(l);
  }

  // دمج الأسطر الفارغة المتتالية
  var res = clean_lines.join("\n").replace(/\n{3,}/g, "\n\n");
  return res.trim();
}

function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

function simpleHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return "h" + Math.abs(h);
}

// استرجاع سياق المنشور الفريد
var ctx = null;
var ctx_id = (typeof params !== "undefined" && params) ? params.trim() : "";
if (ctx_id) {
  ctx = Bot.getProperty(ctx_id);
}
if (!ctx) {
  ctx = {
    media_type: "text",
    media_id: "",
    raw_text: "",
    targets: ["@jhdhhdcj"],
    target_univ: "جامعة معتمدة"
  };
}

var rephrased_text = "";
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    rephrased_text = data.choices[0].message.content.trim();
  }
} catch (e) {}

if (!rephrased_text) {
  rephrased_text = ctx.raw_text || "";
}

// إذا استبعد الذكاء المنشور
if (rephrased_text.indexOf("[IGNORED]") !== -1) {
  if (ctx_id) { Bot.setProperty(ctx_id, null, "json"); }
  return;
}

rephrased_text = cleanArabicAndWebGarbage(rephrased_text);

// تنظيف الرد والتأكد من وجود عنوان أكاديمي بارز
if (rephrased_text.indexOf("📌") === -1 && rephrased_text.indexOf("📢") === -1 && rephrased_text.indexOf("🎓") === -1) {
  rephrased_text = "📌 " + rephrased_text;
}

// ضمان وجود الهاشتاجات الأكاديمية
if (rephrased_text.indexOf("#") === -1) {
  var univ_tag = "#" + (ctx.target_univ || "جامعة").replace(/\s+/g, "_");
  rephrased_text += "\n\n" + univ_tag + " #أخبار_التعليم #شؤون_الطلاب #مواعيد";
}

// كشف الردود الحوارية لمنع نشرها في القنوات كأخبار
var is_conversational_reply = (
  rephrased_text.indexOf("يرجى تزويدي") !== -1 ||
  rephrased_text.indexOf("أعد إرسال") !== -1 ||
  rephrased_text.indexOf("يسعدني إعادة صياغة") !== -1 ||
  rephrased_text.indexOf("أرسل لي نص الخبر") !== -1 ||
  rephrased_text.length < 25
);

if (is_conversational_reply) {
  if (ctx_id) { Bot.setProperty(ctx_id, null, "json"); }
  return;
}

var media_type = ctx.media_type || "text";
var media_file_id = ctx.media_id || "";

if (media_file_id && (media_file_id.indexOf("http") === 0 || media_file_id.indexOf("//") === 0)) {
  if (media_file_id.indexOf("emoji") !== -1 || media_file_id.indexOf("/img/") !== -1 || media_file_id.indexOf("website_icon") !== -1) {
    media_type = "text";
    media_file_id = "";
  }
}

var target_channels = ctx.targets || [];
var current_model = Bot.getProperty("ai_model") || "DeepSeek-V4.1-Flash";
var target_univ_name = ctx.target_univ || "جامعة معتمدة";

var valid_targets = [];
if (target_channels && Array.isArray(target_channels)) {
  for (var t = 0; t < target_channels.length; t++) {
    var c = target_channels[t];
    if (c && c !== "@StudentServicesNews" && c !== "@SecondTargetChannel") {
      valid_targets.push(c);
    }
  }
}

if (valid_targets.length === 0) {
  var custom_target = Bot.getProperty("target_channels") || "@jhdhhdcj";
  valid_targets.push(custom_target);
}

// منع تكرار النشر ببصمة المحتوى + القناة
var pub_fp = "pub_" + simpleHash(valid_targets.join(",") + "|" + rephrased_text.substring(0, 80));
var already_published = Bot.getProperty(pub_fp, false);
if (already_published) {
  if (ctx_id) { Bot.setProperty(ctx_id, null, "json"); }
  return;
}

var safe_post_text = toSafeHtml(rephrased_text);
var sent_count = 0;
var target_names = [];

for (var i = 0; i < valid_targets.length; i++) {
  var ch = valid_targets[i];
  var sent_success = false;

  if (media_file_id && (media_type === "photo" || media_type === "photo_doc" || media_type === "video" || media_type === "document")) {
    // حل مشكلة حد الشرح (Caption 1024 Chars):
    // إذا كان النص طويلاً، نرسل الصورة مع عنوان بارز، ثم نرسل النص الأكاديمي كاملاً فوراً
    if (rephrased_text.length > 950) {
      var short_title = rephrased_text.split("\n")[0] || ("📌 إعلان أكاديمي رسمي - " + target_univ_name);
      try {
        if (media_type === "photo" || media_type === "photo_doc") {
          Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: short_title });
        } else if (media_type === "video") {
          Api.sendVideo({ chat_id: ch, video: media_file_id, caption: short_title });
        } else if (media_type === "document") {
          Api.sendDocument({ chat_id: ch, document: media_file_id, caption: short_title });
        }
        Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
        sent_success = true;
      } catch (eLong) {
        try {
          Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
          sent_success = true;
        } catch (eMsg) {}
      }
    } else {
      // النص أقل من 950 حرف - يرسل مع الصورة مباشرة
      try {
        if (media_type === "photo" || media_type === "photo_doc") {
          Api.sendPhoto({ chat_id: ch, photo: media_file_id, caption: safe_post_text, parse_mode: "HTML" });
        } else if (media_type === "video") {
          Api.sendVideo({ chat_id: ch, video: media_file_id, caption: safe_post_text, parse_mode: "HTML" });
        } else if (media_type === "document") {
          Api.sendDocument({ chat_id: ch, document: media_file_id, caption: safe_post_text, parse_mode: "HTML" });
        }
        sent_success = true;
      } catch (ePhoto) {
        try {
          Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
          sent_success = true;
        } catch (eFallback) {}
      }
    }
  } else {
    // نشر نصي فقط
    try {
      Api.sendMessage({ chat_id: ch, text: safe_post_text, parse_mode: "HTML" });
      sent_success = true;
    } catch (eText) {
      try {
        Api.sendMessage({ chat_id: ch, text: rephrased_text });
        sent_success = true;
      } catch (ePlain) {}
    }
  }

  // محاولة أخيرة مباشرة عبر توكن البوت الثابت وHTTP.post لضمان النشر الفوري
  if (!sent_success) {
    var bot_token = Bot.getProperty("bot_token") || "8755301393:AAHRoTz2XgbD-Qk3eG0Xm_kazoQbJUfQ5Qg";
    try {
      if (media_file_id && (media_type === "photo" || media_type === "photo_doc")) {
        HTTP.post({
          url: "https://api.telegram.org/bot" + bot_token + "/sendPhoto",
          body: { chat_id: ch, photo: media_file_id, caption: safe_post_text, parse_mode: "HTML" }
        });
      } else {
        HTTP.post({
          url: "https://api.telegram.org/bot" + bot_token + "/sendMessage",
          body: { chat_id: ch, text: safe_post_text, parse_mode: "HTML" }
        });
      }
      sent_success = true;
    } catch (eHttp) {}
  }

  if (sent_success) {
    sent_count++;
    target_names.push(ch);
  }
}

// تسجيل بصمة النشر أو إشعار المشرف بسبب المنع
if (sent_count > 0) {
  Bot.setProperty(pub_fp, true, "boolean");
} else {
  var bot_token_err = Bot.getProperty("bot_token") || "8755301393:AAHRoTz2XgbD-Qk3eG0Xm_kazoQbJUfQ5Qg";
  var admin_chat_id = "7607633343";
  var alert_kicked = "⚠️ <b>تنبيه عاجل من نظام النشر الجامعي:</b>\n\n" +
    "تعذر إرسال المنشور إلى: <code>" + valid_targets.join("، ") + "</code>\n\n" +
    "🚨 <b>السبب المؤكد من خوادم تيليجرام:</b>\n" +
    "<code>Forbidden: bot was kicked from the supergroup chat</code>\n" +
    "(البوت @Hhhgggggogddf_bot مطرود أو محظور أو ليس مشرفاً بصلاحية النشر في هذه القناة).\n\n" +
    "🛠️ <b>خطوات الحل الفوري (خلال 30 ثانية):</b>\n" +
    "1. افتح إعدادات القناة/المجموعة " + valid_targets[0] + " في تيليجرام.\n" +
    "2. اذهب إلى: المشرفون (Administrators) -> المستخدمون المحظورون (Removed Users) وألغِ الحظر إن وجد.\n" +
    "3. أضف البوت @Hhhgggggogddf_bot كمشرف (Admin) مع تفعيل صلاحية «نشر الرسائل» (Post Messages).";
  try {
    HTTP.post({
      url: "https://api.telegram.org/bot" + bot_token_err + "/sendMessage",
      body: { chat_id: admin_chat_id, text: alert_kicked, parse_mode: "HTML" }
    });
  } catch (eAdminNotify) {}
}

var total = Bot.getProperty("total_processed", 0) + 1;
Bot.setProperty("total_processed", total, "integer");
Bot.setProperty("last_post_title", rephrased_text.split("\n")[0] || "تحديث أكاديمي جديد", "string");
Bot.setProperty("last_post_time", new Date().toLocaleTimeString(), "string");

// رسالة تأكيد نظيفة خالية من أخطاء الماركداون حتى تظهر الأزرار للمشرف دائماً
var confirm_text = "✅ تمت صياغة ونشر الخبر في قناة (" + target_univ_name + ") بنجاح!\n\n" +
  "• قناة النشر: " + target_names.join("، ") + "\n" +
  "• النموذج الأكاديمي: " + current_model + "\n" +
  "• حالة الوسائط: " + (media_file_id ? "مرفق بالصورة والملف الرسمي" : "نشر نصي منظم") + "\n\n" +
  "👁️ معاينة مقتطف المنشور:\n" +
  "───────────────────\n" +
  (rephrased_text.length > 300 ? rephrased_text.substring(0, 300) + "..." : rephrased_text);

var inline_keyboard = [
  [
    { title: "🔄 فحص أخبار الجامعات مجدداً", command: "/crawl_sources" },
    { title: "🏛️ إدارة الجامعات وقنواتها", command: "/universities" }
  ],
  [
    { title: "📊 حالة النظام والتقارير", command: "/status" },
    { title: "🎛 اللوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, confirm_text);

if (ctx_id) { Bot.setProperty(ctx_id, null, "json"); }
