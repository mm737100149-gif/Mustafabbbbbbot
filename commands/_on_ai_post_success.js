/*CMD
  command: /on_ai_post_success
  help: استلام الصياغة الذكية والتحقق منها قبل النشر
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var jobId = (params || "").trim();
if (!jobId) return;
var job = Bot.getProperty("publish_job_" + jobId);
if (!job) return;

var formatted = "";
var truncated = false;
try {
  var data = JSON.parse(content);
  if (data.choices && data.choices[0] && data.choices[0].message) {
    formatted = String(data.choices[0].message.content || "").trim();
    truncated = data.choices[0].finish_reason === "length";
  }
} catch (e) {}

function clean(text) {
  return String(text || "").replace(/\u00a0/g, " ")
    .replace(/^(?:إليك|ها هي|فيما يلي)[^\n]*(?:الصياغة|المنشور)[^\n]*\n+/i, "")
    .replace(/^(?:•|-|—|\*)\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n").trim();
}
formatted = clean(formatted);

// الرد الناقص أو الحواري لا يُنشر؛ الأصل الكامل أسلم من اختلاق تكملة.
var conversational = /^(?:بالتأكيد|يسعدني|يرجى تزويدي|أرسل لي|عذرًا|عذراً)[\s،:]/.test(formatted);
if (!formatted || truncated || conversational || formatted === "[IGNORED]") {
  Bot.runCommand("/on_ai_post_error " + jobId);
  return;
}

// ضمان بقاء الروابط الرسمية الأصلية إن حذفها النموذج.
var originalLinks = String(job.raw_text || "").match(/https?:\/\/[^\s<>()]+/g) || [];
for (var i = 0; i < originalLinks.length; i++) {
  var link = originalLinks[i].replace(/[.,;!؟،]+$/g, "");
  if (formatted.indexOf(link) === -1) formatted += "\n" + link;
}

job.formatted_text = formatted;
job.formatting_mode = "ai";
job.status = "ready";
job.ai_error = "";
Bot.setProperty("publish_job_" + jobId, job, "json");
Bot.runCommand("/publish_next", { job_id: jobId });
