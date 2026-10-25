/*CMD
  command: /on_twitter_success
  help: معالج استلام تغريدات تويتر/X من Nitter RSS وصياغتها ونشرها في قناة الجامعة حصراً مع الصور V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

// params = univ_id|handle
var raw_params = (params || "").trim();
var p_parts = raw_params.split("|");
var univ_id = p_parts[0] ? p_parts[0].trim() : "";
var handle = p_parts[1] ? p_parts[1].trim().toLowerCase() : "";
if (!handle) return;

var univ_projects = Bot.getProperty("university_projects", []);
var target_univ = null;
for (var u = 0; u < univ_projects.length; u++) {
  if (univ_projects[u].id === univ_id) {
    target_univ = univ_projects[u];
    break;
  }
}

// البحث بربط الحساب مباشرة إن لم يطابق المعرف
if (!target_univ) {
  for (var u2 = 0; u2 < univ_projects.length; u2++) {
    var tw_list = univ_projects[u2].twitter_sources || [];
    for (var s = 0; s < tw_list.length; s++) {
      if (tw_list[s].replace(/^@/, "").toLowerCase() === handle) {
        target_univ = univ_projects[u2];
        break;
      }
    }
    if (target_univ) break;
  }
}

if (!target_univ && univ_projects.length > 0) {
  target_univ = univ_projects[0];
}
if (!target_univ) return;

function cleanHtml(html) {
  if (!html) return "";
  var s = html;
  // إزالة وسوم CDATA
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
  s = s.replace(/<br\s*[\/]?>/gi, "\n");
  s = s.replace(/<p[^>]*>/gi, "\n");
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, function(match, link, anchor) {
    if (!anchor || anchor.indexOf("http") === 0 || anchor === link) return " " + link + " ";
    return anchor + " (" + link + ")";
  });
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/gi, " ");

  // تصحيح الرموز المشوهة
  s = s.replace(/ߓ堙噈اعيد/g, "مواعيد");
  s = s.replace(/ߓꠙ嘰كرات/g, "مذكرات");
  s = s.replace(/ߎ㠘㙆ظمة/g, "أنظمة");
  s = s.replace(/[̀-ͯ]/g, "");
  s = s.replace(/[ࠀ-࿿]/g, "");
  s = s.replace(/[一-鿿]/g, "");
  s = s.replace(/[-]/g, "");

  // تنظيف بقايا تويتر في النهاية
  s = s.replace(/\s+X\s*$/g, "");
  s = s.replace(/\bX\s*$/g, "");

  return s.trim();
}

function extractFirstImage(xmlChunk) {
  if (!xmlChunk) return "";
  // 1. فحص وسوم enclosure
  var encMatch = xmlChunk.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (encMatch && encMatch[1] && encMatch[1].indexOf("emoji") === -1) {
    return encMatch[1].trim();
  }
  // 2. فحص وسوم media:content
  var mediaMatch = xmlChunk.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (mediaMatch && mediaMatch[1] && mediaMatch[1].indexOf("emoji") === -1) {
    return mediaMatch[1].trim();
  }
  // 3. فحص وسم img في الوصف
  var imgMatch = xmlChunk.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1] && imgMatch[1].indexOf("emoji") === -1) {
    var u = imgMatch[1].trim();
    if (u.indexOf("//") === 0) u = "https:" + u;
    return u;
  }
  return "";
}

// استخراج عناصر التغريدات من الـ RSS
var safe_content = content.length > 25000 ? content.substring(0, 25000) : content;
var item_chunks = safe_content.split("<item>");

var last_seen_key = "tw_last_" + handle;
var last_seen = Bot.getProperty(last_seen_key, "");

var found_tweet = null;

for (var idx = 1; idx < item_chunks.length && idx <= 6; idx++) {
  var item_str = item_chunks[idx].split("</item>")[0];

  function grab(tag) {
    var a = item_str.indexOf("<" + tag + ">");
    var b = item_str.indexOf("</" + tag + ">");
    if (a === -1 || b === -1) return "";
    return item_str.substring(a + tag.length + 2, b);
  }

  var raw_title = cleanHtml(grab("title"));
  var raw_desc_raw = grab("description");
  var raw_desc = cleanHtml(raw_desc_raw);
  var raw_link = cleanHtml(grab("link"));
  var raw_guid = cleanHtml(grab("guid")) || raw_link;
  var img_url = extractFirstImage(item_str);

  // إزالة روابط الصور المكررة في النص
  raw_desc = raw_desc.replace(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)\S*/gi, "").trim();

  var full_text = raw_desc || raw_title;
  if (!full_text || full_text.length < 15) continue;

  // منع التكرار ببصمة التغريدة
  var seen_key = "seen_tw_" + encodeURIComponent((raw_guid || full_text).slice(0, 40));
  if (Bot.getProperty(seen_key)) continue;

  // فحص استبعاد الإعلانات التجارية للخدمات الطلابية
  var ad_keywords = ["حل واجبات", "حل الواجبات", "بحوث تخرج", "خدمات طلابية مدفوعة", "كتابة أبحاث", "إعلان ممول", "حل كويزات"];
  var is_ad = false;
  for (var ak = 0; ak < ad_keywords.length; ak++) {
    if (full_text.indexOf(ad_keywords[ak]) !== -1) {
      is_ad = true;
      break;
    }
  }

  // إذا كانت إعلاناً تجارياً، نتخطاها
  if (is_ad) continue;

  Bot.setProperty(seen_key, true, "boolean");
  found_tweet = { text: full_text, image: img_url, guid: raw_guid };
  if (!last_seen) { Bot.setProperty(last_seen_key, raw_guid, "string"); }
  break;
}

if (!found_tweet) {
  return;
}

Bot.setProperty(last_seen_key, found_tweet.guid || last_seen, "string");

// سياق فريد للتغريدة
var ctx_id = "ctx_tw_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
Bot.setProperty(ctx_id, {
  media_type: found_tweet.image ? "photo" : "text",
  media_id: found_tweet.image || "",
  raw_text: found_tweet.text,
  targets: [target_univ.target_channel || "@jhdhhdcj"],
  target_univ: target_univ.name,
  source_origin: "x.com/" + handle,
  created_at: Date.now()
}, "json");

var base_url = Bot.getProperty("ai_base_url") || "https://api.hcnsec.cn/v1";
var api_key = Bot.getProperty("ai_api_key") || "sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii";
var current_model = Bot.getProperty("ai_model") || "DeepSeek-V4.1-Flash";

var system_prompt = "أنت محرر ومسؤول النشر الأكاديمي الرسمي المعتمد لقناة طلاب: (" + target_univ.name + ").\n" +
  "هذا منشور رسمي صادر من حساب الحساب الجامعي المعتمد (@" + handle + "). صغه كخبر رسمي فوري وموثوق:\n" +
  "1. ابدأ بعنوان بارز يلخص الإعلان أو التوجيه الأكاديمي (📌 إعلان هام...)\n" +
  "2. اعرض المواعيد، التواريخ، والخطوات بنقاط محددة ودقيقة\n" +
  "3. ممنوع منعاً باتاً ذكر (تويتر أو منصة X أو تغريدة أو بحسب الحساب)\n" +
  "4. احذف معرفات @ الزائدة، واحتفظ بالروابط الرسمية للأنظمة والبوابات\n" +
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
      { role: "user", content: found_tweet.text }
    ],
    temperature: 0.25,
    max_tokens: 2200
  },
  success: "/on_ai_post_success " + ctx_id,
  error: "/on_ai_post_error " + ctx_id,
  background: true
});
