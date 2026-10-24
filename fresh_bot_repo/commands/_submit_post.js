/*CMD
  command: /submit_post
  help: إدخال منشور إلى طابور النشر الموحد مع عزل المصدر ومنع التكرار
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

// المدخل الوحيد لمسار النشر. لا يعتمد على اسم الجامعة لقبول المصدر المربوط.
if (!options || !options.university_id || !options.source_id || !options.source_post_id) return;

var projects = Bot.getProperty("university_projects", []) || [];
var project = null;
for (var i = 0; i < projects.length; i++) {
  if (projects[i].id === options.university_id && projects[i].enabled !== false) {
    project = projects[i];
    break;
  }
}
// لا توجد قناة افتراضية ولا تحويل إلى أول جامعة: الربط الصريح شرط للنشر.
if (!project || !project.target_channel) return;

var sourceText = String(options.raw_text || "").replace(/\u00a0/g, " ").trim();
var media = Array.isArray(options.media) ? options.media : [];
if (!sourceText && media.length === 0) return;

function normalizeText(s) {
  return String(s || "").toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي")
    .replace(/\s+/g, " ").trim();
}

function isAdvertisement(text) {
  var n = normalizeText(text);
  var strong = [
    "حل واجبات", "حل الواجبات", "حل اسايمنت", "كتابة ابحاث", "كتابة بحوث",
    "اعداد ابحاث", "إعداد أبحاث", "بحوث تخرج", "مشاريع تخرج مقابل",
    "اعلان مدفوع", "اعلان ممول", "برعاية اعلانية", "خدمات طلابية مدفوعة",
    "اسعار خاصة للطلاب", "تواصل واتساب", "للتواصل واتس", "ضمان النجاح مقابل"
  ];
  for (var j = 0; j < strong.length; j++) {
    if (n.indexOf(normalizeText(strong[j])) !== -1) return true;
  }
  var telegramLinks = n.match(/(?:t\.me\/|telegram\.me\/)[a-z0-9_+/-]+/g) || [];
  var handles = n.match(/@[a-z0-9_]{4,32}/g) || [];
  var salesWords = ["للتواصل", "للطلب", "خصم", "الاسعار", "الأسعار", "راسلنا", "سعر"];
  var salesHits = 0;
  for (var k = 0; k < salesWords.length; k++) {
    if (n.indexOf(normalizeText(salesWords[k])) !== -1) salesHits++;
  }
  return (telegramLinks.length + handles.length >= 3 && salesHits > 0);
}

var sourcePostId = String(options.source_post_id).trim();
var target = String(project.target_channel).trim();
var identity = [options.source_type || "unknown", options.source_id, sourcePostId, target].join("|");

// بصمتان 32-بتان للهوية الثابتة؛ لا تعتمدان على أول 80 حرفًا ولا على نص الذكاء المتغير.
function hashPart(s, seed) {
  var h = seed | 0;
  for (var x = 0; x < s.length; x++) h = ((h << 5) - h + s.charCodeAt(x)) | 0;
  return (h >>> 0).toString(36);
}
var fingerprint = hashPart(identity, 5381) + hashPart(identity.split("").reverse().join(""), 131);
var publishedKey = "publication_v2_" + fingerprint;
var jobKey = "publish_job_" + fingerprint;
if (Bot.getProperty(publishedKey) || Bot.getProperty(jobKey) || Bot.getProperty("filtered_v2_" + fingerprint)) return;

if (isAdvertisement(sourceText)) {
  Bot.setProperty("filtered_v2_" + fingerprint, { reason: "advertisement", at: Date.now() }, "json");
  var blockedCount = Bot.getProperty("total_ads_blocked", 0) + 1;
  Bot.setProperty("total_ads_blocked", blockedCount, "integer");
  return;
}

var job = {
  id: fingerprint,
  university_id: project.id,
  university_name: project.name,
  target_channel: target,
  source_type: options.source_type || "unknown",
  source_id: String(options.source_id),
  source_post_id: sourcePostId,
  source_url: options.source_url || "",
  source_profile: project.source_profile || "",
  raw_text: sourceText,
  media: media,
  status: "pending",
  attempts: 0,
  notify: options.notify === true,
  created_at: Date.now(),
  step: media.length ? "media" : "text",
  media_index: 0,
  text_index: 0
};
Bot.setProperty(jobKey, job, "json");
var queue = Bot.getProperty("pending_publish_jobs", []) || [];
if (queue.indexOf(fingerprint) === -1) queue.push(fingerprint);
if (queue.length > 500) queue = queue.slice(queue.length - 500);
Bot.setProperty("pending_publish_jobs", queue, "json");
Bot.runCommand("/process_publish_job", { job_id: fingerprint });
