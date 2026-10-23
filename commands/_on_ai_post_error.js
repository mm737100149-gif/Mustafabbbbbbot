/*CMD
  command: /on_ai_post_error
  help: التراجع الأمين إلى تنسيق محلي عند تعذر الذكاء الاصطناعي
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

job.formatted_text = String(job.raw_text || "").replace(/\u00a0/g, " ")
  .replace(/\r\n?/g, "\n").replace(/^(?:•|-|—|\*)\s*$/gm, "")
  .replace(/\n{3,}/g, "\n\n").trim();
job.formatting_mode = "local_after_ai_error";
job.status = "ready";
job.ai_error = "تعذر الحصول على صياغة صالحة من خدمة الذكاء؛ استُخدم النص الأصلي بعد تنظيفه محليًا دون إضافة محتوى.";
Bot.setProperty("publish_job_" + jobId, job, "json");
Bot.setProperty("last_ai_error", { at: Date.now(), job_id: jobId }, "json");
Bot.runCommand("/publish_next", { job_id: jobId });
