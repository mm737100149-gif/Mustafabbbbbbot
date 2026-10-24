/*CMD
  command: /process_publish_job
  help: صياغة مهمة النشر ثم تسليمها إلى مرسل الوسائط والنصوص
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if (!options || !options.job_id) return;
var jobId = String(options.job_id);
var job = Bot.getProperty("publish_job_" + jobId);
if (!job || Bot.getProperty("publication_v2_" + jobId)) return;
if (job.status === "publishing") return;

function localClean(text) {
  var s = String(text || "").replace(/\u00a0/g, " ");
  s = s.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n");
  s = s.replace(/^(?:•|-|—|\*)\s*$/gm, "").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

// بلا مفتاح أو مع تعطيل الذكاء: تنسيق محلي أمين دون اختلاق عنوان أو دعوات أو هاشتاجات.
var aiEnabled = Bot.getProperty("ai_enabled", true);
var apiKey = Bot.getProperty("ai_api_key", "");
if (!aiEnabled || !apiKey || !job.raw_text) {
  job.formatted_text = localClean(job.raw_text);
  job.formatting_mode = job.raw_text ? "local" : "caption_only";
  job.status = "ready";
  Bot.setProperty("publish_job_" + jobId, job, "json");
  Bot.runCommand("/publish_next", { job_id: jobId });
  return;
}

job.status = "formatting";
Bot.setProperty("publish_job_" + jobId, job, "json");
var baseUrl = Bot.getProperty("ai_base_url", "https://api.openai.com/v1");
var model = Bot.getProperty("ai_model", "gpt-4o-mini");
var custom = Bot.getProperty("custom_instructions", Bot.getProperty("custom_instruction", ""));
var learned = Bot.getProperty("learned_instructions", []) || [];
var systemPrompt =
  "أنت محرر عربي أكاديمي محترف. المنشور ورد من مصدر ربطه المشرف بهذه الوجهة، لذلك لا تشترط ذكر اسم الجامعة ولا تحكم على صلته بالجامعة.\n" +
  "أعد صياغة النص فقط، بلا مقدمة عن نفسك ولا عبارات مثل: إليك الصياغة. لا تضف حقائق أو مواعيد أو أرقامًا أو شروطًا غير موجودة.\n" +
  "حافظ على كل تاريخ وموعد نهائي ورقم ورابط رسمي واسم ملف أو مرجع. احذف فقط الترويج التجاري ومعرفات القنوات الدعائية.\n" +
  "استخدم لغة عربية طبيعية رصينة وواضحة، وفقرات أو نقاطًا عند الحاجة فقط. لا تضف دعوة تفاعل ولا هاشتاجات ولا إيموجي من عندك.\n" +
  "لا تستخدم [IGNORED] ولا تعتذر. أعد المنشور الجاهز فقط دون شرح.\n" +
  "الجامعة/السياق: " + job.university_name + "\n" +
  "وصف المصدر المعتمد: " + (job.source_profile || "مصدر أكاديمي مرتبط صراحة بالوجهة") + "\n" +
  (custom ? "تعليمات المشرف: " + custom + "\n" : "") +
  (learned.length ? "تعليمات متعلمة سابقًا:\n- " + learned.join("\n- ") : "");
var userContent = "المصدر: " + job.source_id + "\nالنص الأصلي:\n" + job.raw_text;

HTTP.post({
  url: baseUrl.replace(/\/+$/, "") + "/chat/completions",
  headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
  body: {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ],
    temperature: 0.15,
    max_tokens: 2200
  },
  success: "/on_ai_post_success " + jobId,
  error: "/on_ai_post_error " + jobId,
  background: true
});
