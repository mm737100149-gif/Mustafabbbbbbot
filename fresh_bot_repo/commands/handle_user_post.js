/*CMD
  command: handle_user_post
  help: محرك النشر التلقائي الذكي ومعالج الوسائط والربط الصارم والعزل التام للمشاريع الجامعية V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

// دالة تحويل الماركداون إلى HTML آمن
function toSafeHtml(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&/g, "&amp;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  return s;
}

// دالة تنظيف شوائب الويب وX و&nbsp; والنقاط الفارغة
function cleanWebAndTwitterGarbage(txt) {
  if (!txt) return "";
  var s = txt;
  s = s.replace(/&nbsp;\s*X/gi, "");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+X\s*$/g, "");
  s = s.replace(/\s+X\n/g, "\n");
  s = s.replace(/\bX\s*$/g, "");
  s = s.replace(/ߓ堙噈اعيد/g, "مواعيد");
  s = s.replace(/ߓꠙ嘰كرات/g, "مذكرات");
  s = s.replace(/ߎ㠘㙆ظمة/g, "أنظمة");
  s = s.replace(/[̀-ͯ]/g, "");
  s = s.replace(/[ࠀ-࿿]/g, "");
  s = s.replace(/[一-鿿]/g, "");
  s = s.replace(/[-]/g, "");

  var lines = s.split("\n");
  var clean_lines = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (!l) {
      clean_lines.push("");
      continue;
    }
    if (l === "•" || l === "-" || l === "*" || l === "• " || l === "- " || l === "* " || l === "📌" || l === "🎓") {
      continue;
    }
    clean_lines.push(l);
  }
  return clean_lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function simpleHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return "h" + Math.abs(h);
}

// 1. استخراج كائن الرسالة
var msg_obj = null;
if (typeof request !== "undefined" && request) {
  if (request.channel_post) {
    msg_obj = request.channel_post;
  } else if (request.message) {
    msg_obj = request.message;
  } else if (request.edited_channel_post) {
    msg_obj = request.edited_channel_post;
  } else if (request.edited_message) {
    msg_obj = request.edited_message;
  } else {
    msg_obj = request;
  }
}

// حارس حلقة التكرار الذاتي: منشورات قناتنا نفسها لا تُعالج مجدداً
if (msg_obj && msg_obj.chat && msg_obj.chat.type === "channel") {
  var my_channels = Bot.getProperty("target_channels") || "@jhdhhdcj";
  var posted_by = "@" + (msg_obj.chat.username || "");
  if (posted_by === my_channels) { return; }
}

// 2. استخراج النص أو الشرح (Caption)
var raw_text = "";
if (msg_obj) {
  if (msg_obj.caption) {
    raw_text = msg_obj.caption;
  } else if (msg_obj.text) {
    raw_text = msg_obj.text;
  }
}
if (!raw_text && typeof message !== "undefined" && message) {
  raw_text = message;
}

// 3. استخراج الوسائط
var media_type = null;
var media_file_id = null;

var photo_arr = null;
if (msg_obj && msg_obj.photo) photo_arr = msg_obj.photo;
else if (typeof request !== "undefined" && request && request.photo) photo_arr = request.photo;
else if (typeof request !== "undefined" && request && request.message && request.message.photo) photo_arr = request.message.photo;
else if (typeof request !== "undefined" && request && request.channel_post && request.channel_post.photo) photo_arr = request.channel_post.photo;
else if (typeof options !== "undefined" && options && options.photo) photo_arr = options.photo;

if (photo_arr) {
  if (Array.isArray(photo_arr) && photo_arr.length > 0) {
    media_type = "photo";
    media_file_id = photo_arr[photo_arr.length - 1].file_id;
  } else if (typeof photo_arr === "object" && photo_arr.file_id) {
    media_type = "photo";
    media_file_id = photo_arr.file_id;
  } else if (typeof photo_arr === "string") {
    media_type = "photo";
    media_file_id = photo_arr;
  }
}

if (!media_type) {
  var vid = (msg_obj && msg_obj.video) || (typeof request !== "undefined" && request && (request.video || (request.message && request.message.video) || (request.channel_post && request.channel_post.video)));
  if (vid && vid.file_id) {
    media_type = "video";
    media_file_id = vid.file_id;
  }
}

if (!media_type) {
  var doc = (msg_obj && msg_obj.document) || (typeof request !== "undefined" && request && (request.document || (request.message && request.message.document) || (request.channel_post && request.channel_post.document)));
  if (doc && doc.file_id) {
    var mime = (doc.mime_type || "").toLowerCase();
    if (mime.indexOf("image/") === 0) {
      media_type = "photo_doc";
    } else {
      media_type = "document";
    }
    media_file_id = doc.file_id;
  }
}

// إذا كانت الرسالة أمراً برمجياً مثل /start
if (raw_text && raw_text.indexOf("/") === 0 && !media_file_id) {
  return;
}

if (!raw_text && !media_file_id) {
  return;
}

// 4. استخراج مصدر الرسالة
var source_origin = null;
if (msg_obj && msg_obj.chat && (msg_obj.chat.type === "channel" || msg_obj.chat.type === "supergroup")) {
  source_origin = msg_obj.chat.username ? ("@" + msg_obj.chat.username) : ("" + msg_obj.chat.id);
} else if (msg_obj && msg_obj.forward_from_chat) {
  source_origin = msg_obj.forward_from_chat.username ? ("@" + msg_obj.forward_from_chat.username) : ("" + msg_obj.forward_from_chat.id);
} else if (msg_obj && msg_obj.forward_origin) {
  if (msg_obj.forward_origin.chat) {
    source_origin = msg_obj.forward_origin.chat.username ? ("@" + msg_obj.forward_origin.chat.username) : ("" + msg_obj.forward_origin.chat.id);
  } else if (msg_obj.forward_origin.sender_chat) {
    source_origin = msg_obj.forward_origin.sender_chat.username ? ("@" + msg_obj.forward_origin.sender_chat.username) : ("" + msg_obj.forward_origin.sender_chat.id);
  }
}

var is_private_chat = (msg_obj && msg_obj.chat && msg_obj.chat.type === "private") || (typeof chat !== "undefined" && chat && chat.chat_type === "private");
var is_forwarded = !!(source_origin || (msg_obj && (msg_obj.forward_date || msg_obj.forward_from_chat || msg_obj.forward_origin)));

// فحص حالة إيقاف البوت
var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ البوت متوقف حالياً. استخدم زر التشغيل في /start للمتابعة.");
  return;
}

// منع تكرار نفس المنشور الوارد
var incoming_fingerprint = simpleHash((source_origin || "direct") + "|" + (raw_text || "").substring(0, 100) + "|" + (media_file_id || ""));
var last_incoming = Bot.getProperty("last_incoming_fp", "");
if (incoming_fingerprint === last_incoming) {
  return;
}
Bot.setProperty("last_incoming_fp", incoming_fingerprint, "string");

// مطابقة الجامعة المستهدفة
var univ_projects = Bot.getProperty("university_projects", []);
if (!univ_projects || !Array.isArray(univ_projects) || univ_projects.length === 0) {
  var def_target = Bot.getProperty("target_channels") || "@jhdhhdcj";
  univ_projects = [
    {
      id: "univ_ksu",
      name: "جامعة الملك سعود",
      target_channel: def_target,
      telegram_sources: ["@KSU_News"],
      twitter_sources: ["@ksu_news"],
      google_news_query: "جامعة الملك سعود",
      google_news_enabled: true,
      keywords: ["جامعة الملك سعود", "الملك سعود", "KSU", "قبول", "تسجيل", "اختبارات", "جداول"],
      enabled: true
    }
  ];
  Bot.setProperty("university_projects", univ_projects, "json");
}

var matched_univ = null;
var clean_origin = source_origin ? source_origin.toLowerCase().replace(/^@/, "").replace("https://t.me/s/", "").replace("https://t.me/", "") : "";

// أولاً: المطابقة عبر المصدر المربوط
if (clean_origin) {
  for (var u1 = 0; u1 < univ_projects.length; u1++) {
    var p1 = univ_projects[u1];
    if (!p1.enabled) continue;
    var all_src = (p1.telegram_sources || []).concat(p1.twitter_sources || []);
    for (var s1 = 0; s1 < all_src.length; s1++) {
      var s_clean = all_src[s1].toLowerCase().replace(/^@/, "").replace("https://t.me/s/", "").replace("https://t.me/", "");
      if (s_clean === clean_origin) {
        matched_univ = p1;
        break;
      }
    }
    if (matched_univ) break;
  }
}

// ثانياً: البحث في متن النص عن اسم الجامعة أو كلماتها المفتاحية
if (!matched_univ && raw_text) {
  var lower_text = raw_text.toLowerCase();
  for (var u2 = 0; u2 < univ_projects.length; u2++) {
    var p2 = univ_projects[u2];
    if (!p2.enabled) continue;
    if (lower_text.indexOf(p2.name.toLowerCase()) !== -1) {
      matched_univ = p2;
      break;
    }
    for (var k = 0; k < (p2.keywords || []).length; k++) {
      var kw = p2.keywords[k].toLowerCase();
      if (kw.length >= 4 && lower_text.indexOf(kw) !== -1) {
        matched_univ = p2;
        break;
      }
    }
    if (matched_univ) break;
  }
}

if (!matched_univ) {
  if (univ_projects.length > 0) {
    matched_univ = univ_projects[0];
  }
}

if (!matched_univ) return;

var target_channels = [matched_univ.target_channel || "@jhdhhdcj"];
var cleaned_raw_text = cleanWebAndTwitterGarbage(raw_text);

// كشف إعلانات المنافسين واستبدالها بإعلان المشرف
var ad_keywords = ["إعلان مدفوع", "حل واجبات", "حل الواجبات", "بحوث تخرج", "بحث تخرج", "خدمات طلابية", "مشاريع تخرج", "مشروع تخرج", "كتابة أبحاث", "إعلان ممول", "برعاية", "للتواصل واتساب", "حل كويزات"];
var is_ad = false;
for (var i = 0; i < ad_keywords.length; i++) {
  if (cleaned_raw_text.indexOf(ad_keywords[i]) !== -1) {
    is_ad = true;
    break;
  }
}

if (is_ad) {
  var custom_ad = Bot.getProperty("custom_ad", "🎓 <b>خدمات طلابية وأكاديمية معتمدة ومتكاملة</b> 🎓\n\n" +
    "يسرنا تقديم الدعم الأكاديمي الشامل للطلبة والباحثين:\n" +
    "• مساعدة متخصصة في البحوث ومشاريع التخرج والتدقيق اللغوي\n" +
    "• تنسيق الرسائل العلمية وتلخيص المقررات الدراسية\n" +
    "• إعداد العروض التقديمية والتقارير الأكاديمية\n\n" +
    "📞 <b>للتواصل والطلب المباشر عبر المشرف</b>: @M_S_F_G\n" +
    "✨ <i>جودة أكاديمية معتمدة، دقة في المواعيد، وأسعار خاصة للطلاب!</i>");

  var ch_target = matched_univ.target_channel;
  try {
    if ((media_type === "photo" || media_type === "photo_doc") && media_file_id) {
      Api.sendPhoto({ chat_id: ch_target, photo: media_file_id, caption: custom_ad, parse_mode: "HTML" });
    } else if (media_type === "video") {
      Api.sendVideo({ chat_id: ch_target, video: media_file_id, caption: custom_ad, parse_mode: "HTML" });
    } else {
      Api.sendMessage({ chat_id: ch_target, text: custom_ad, parse_mode: "HTML" });
    }
  } catch (err) {}

  Bot.sendMessage("🎯 تم كشف إعلان خارجي واستبداله بإعلان خدماتك في قناة (" + matched_univ.name + "): " + ch_target);
  return;
}

// سياق فريد لكل منشور
var ctx_id = "ctx_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
var ctx = {
  media_type: media_type || "text",
  media_id: media_file_id || "",
  raw_text: cleaned_raw_text,
  targets: target_channels,
  target_univ: matched_univ.name,
  source_origin: source_origin || "direct_admin",
  created_at: Date.now()
};
Bot.setProperty(ctx_id, ctx, "json");

var base_url = Bot.getProperty("ai_base_url") || "https://api.hcnsec.cn/v1";
var api_key = Bot.getProperty("ai_api_key") || "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii";
var current_model = Bot.getProperty("ai_model") || "DeepSeek-V4.1-Flash";

if (is_private_chat) {
  Bot.sendMessage("⚡ جاري صياغة المنشور باحترافية أكاديمية ونشره في (" + matched_univ.name + ")...");
}

var system_prompt = "أنت محرر ومسؤول النشر الأكاديمي الرسمي المعتمد لقناة طلاب: (" + matched_univ.name + ").\n" +
  "صِغ هذا الخبر بأسلوب إخباري راقٍ ومميز وأصيل كأنك الناشر الأول:\n" +
  "1. ابدأ بعنوان بارز يوضح موضوع الخبر للطلاب (📌 إعلان هام بشأن...)\n" +
  "2. نقاط محددة وسهلة القراءة تبرز المواعيد والخطوات والشروط بدقة تامة\n" +
  "3. احذف معرفات وروابط القنوات الترويجية السابقة، مع الاحتفاظ بكافة روابط البوابات والأنظمة الرسمية\n" +
  "4. احذف نهائياً أي شوائب مثل &nbsp; أو X أو نقاط فارغة\n" +
  "5. اختم بسؤال تفاعلي للطلاب (💬) وهاشتاجات الجامعة الرسمية\n" +
  "6. لا تقطع النص واجعله مكتملاً وأنيقاً.";

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
      { role: "user", content: cleaned_raw_text || "منشور مرفق بملف وصورة للطلاب" }
    ],
    temperature: 0.25,
    max_tokens: 2200
  },
  success: "/on_ai_post_success " + ctx_id,
  error: "/on_ai_post_error " + ctx_id,
  background: true
});
