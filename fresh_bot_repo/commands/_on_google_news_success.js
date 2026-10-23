/*CMD
  command: /on_google_news_success
  help: معالج استلام وتصفية أخبار جوجل نيوز وصياغتها ونشرها بدون تكرار V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

var univ_id = (params || "").trim();
var univ_projects = Bot.getProperty("university_projects", []);
var target_univ = null;

for (var u = 0; u < univ_projects.length; u++) {
  if (univ_projects[u].id === univ_id) {
    target_univ = univ_projects[u];
    break;
  }
}
if (!target_univ && univ_projects.length > 0) {
  target_univ = univ_projects[0];
}
if (!target_univ) return;

function cleanHtml(html) {
  if (!html) return "";
  var s = html;
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/\s+/g, " ");
  return s.trim();
}

function simpleHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return "h" + Math.abs(h);
}

// الكلمات المفتاحية الأكاديمية الحصرية التي تهم الطلاب ومسيرتهم الدراسية
var academic_keywords = [
  "قبول", "تسجيل", "مواعيد", "اختبارات", "جداول", "تقويم", "مكافأة", "إعانة", 
  "نتائج", "حذف وإضافة", "بوابة", "فصل دراسي", "تخرج", "شروط التقديم", 
  "عمادة", "دراسة", "محاضرات", "منحة", "دبلوم", "بكالوريوس"
];

var safe_content = content.length > 15000 ? content.substring(0, 15000) : content;
var item_chunks = safe_content.split("<item>");
var found_article = null;

for (var idx = 1; idx < item_chunks.length && idx <= 5; idx++) {
  var item_str = item_chunks[idx].split("</item>")[0];

  function grab(tag) {
    var a = item_str.indexOf("<" + tag + ">");
    var b = item_str.indexOf("</" + tag + ">");
    if (a === -1 || b === -1) return "";
    return item_str.substring(a + tag.length + 2, b);
  }

  var raw_title = cleanHtml(grab("title"));
  var raw_desc = cleanHtml(grab("description"));
  var raw_link = cleanHtml(grab("link"));

  if (!raw_title || raw_title.length < 15) continue;

  // تنظيف المصدر الخارجي من نهاية العنوان (مثل "- جريدة الرياض")
  raw_title = raw_title.replace(/\s*-\s*[^-]+$/, "").trim();

  var combined = (raw_title + " " + raw_desc).toLowerCase();

  // 1. التحقق من ذكر اسم الجامعة
  var mentions_univ = (combined.indexOf(target_univ.name.toLowerCase()) !== -1);
  if (!mentions_univ) {
    for (var k = 0; k < (target_univ.keywords || []).length; k++) {
      if (combined.indexOf(target_univ.keywords[k].toLowerCase()) !== -1) {
        mentions_univ = true;
        break;
      }
    }
  }
  if (!mentions_univ) continue;

  // 2. التحقق الصارم من أن الخبر يتعلق بالمحتوى الدراسي ومصالح الطلاب حصراً (منع الأخبار الروتينية غير الأكاديمية)
  var has_academic_substance = false;
  for (var ak = 0; ak < academic_keywords.length; ak++) {
    if (combined.indexOf(academic_keywords[ak]) !== -1) {
      has_academic_substance = true;
      break;
    }
  }
  if (!has_academic_substance) continue;

  // 3. منع التكرار ببصمة العنوان والرابط
  var article_hash = simpleHash(raw_title + "|" + raw_link);
  var seen_key = "seen_gnews_" + article_hash;
  if (Bot.getProperty(seen_key)) continue;

  Bot.setProperty(seen_key, true, "boolean");
  found_article = {
    title: raw_title,
    desc: raw_desc,
    link: raw_link
  };
  break;
}

if (!found_article) {
  return;
}

var article_text = "عنوان الخبر: " + found_article.title + "\n\n" +
  "تفاصيل الخبر من المصادر الرسمية: " + found_article.desc;

if (found_article.link) {
  article_text += "\n\nرابط البوابة أو المصدر: " + found_article.link;
}

// حفظ بيانات الإرسال والتوجيه لقناة هذه الجامعة حصراً
var ctx_id = "ctx_gnews_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
Bot.setProperty(ctx_id, {
  media_type: "text",
  media_id: "",
  raw_text: article_text,
  targets: [target_univ.target_channel || "@jhdhhdcj"],
  target_univ: target_univ.name,
  source_origin: "google_news",
  created_at: Date.now()
}, "json");

var base_url = Bot.getProperty("ai_base_url") || "https://api.hcnsec.cn/v1";
var api_key = Bot.getProperty("ai_api_key") || "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii";
var current_model = Bot.getProperty("ai_model") || "DeepSeek-V4.1-Flash";

var system_prompt = "أنت محرر ومسؤول النشر الأكاديمي الرسمي المعتمد لقناة طلاب: (" + target_univ.name + ").\n" +
  "صِغ هذا الخبر الجامعي المهم بأسلوب رسمي وراقٍ ومباشر للطلاب:\n" +
  "1. ابدأ بعنوان بارز يلخص الخبر الأكاديمي (📌 إعلان هام بشأن...)\n" +
  "2. نظّم المواعيد والخطوات والشروط بنقاط واضحة ومباشرة\n" +
  "3. ممنوع ذكر اسم صحيفة أو موقع إخباري، واكتب بأسلوبك كإعلان جامعي رسمي موجه للطلاب\n" +
  "4. احتفظ بكافة الروابط الرسمية للجامعة دون حذف\n" +
  "5. اختم بسؤال تفاعلي للطلاب (💬) وهاشتاجات الجامعة الرسمية.";

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
      { role: "user", content: article_text }
    ],
    temperature: 0.2,
    max_tokens: 1500
  },
  success: "/on_ai_post_success " + ctx_id,
  error: "/on_ai_post_error " + ctx_id,
  background: true
});
