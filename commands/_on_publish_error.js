/*CMD
  command: /on_publish_error
  help: حفظ فشل النشر وجدولة إعادة المحاولة دون تسجيل نجاح زائف
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var jobId = "";
var errorText = "فشل غير معروف";
if (options && options.bb_options) jobId = options.bb_options.job_id || "";
if (!jobId && options) jobId = options.job_id || "";
if (options && options.error) errorText = typeof options.error === "string" ? options.error : JSON.stringify(options.error);
if (!jobId) return;
var key = "publish_job_" + jobId;
var job = Bot.getProperty(key);
if (!job) return;

job.attempts = (job.attempts || 0) + 1;
job.status = job.attempts >= 6 ? "failed" : "pending_retry";
job.last_error = String(errorText).substring(0, 700);
job.last_attempt_at = Date.now();
Bot.setProperty(key, job, "json");
Bot.setProperty("last_publish_error", { job_id: jobId, error: job.last_error, at: Date.now() }, "json");

if (job.attempts < 6) {
  var delay = Math.min(900, 30 * Math.pow(2, job.attempts - 1));
  Bot.run({ command: "/publish_next", run_after: delay, options: { job_id: jobId }, label: "publish_retry_" + jobId });
  return;
}

Bot.setProperty("total_publish_failures", Bot.getProperty("total_publish_failures", 0) + 1, "integer");
if (job.notify) {
  var adminId = Bot.getProperty("admin_id", 7607633343);
  if (adminId) Api.sendMessage({
    chat_id: adminId,
    text: "❌ بقيت مهمة النشر في الطابور بعد 6 محاولات.\nالوجهة: " + job.target_channel +
      "\nالمصدر: " + job.source_id + "\nالسبب: " + job.last_error +
      "\nلم تُسجّل كمنشورة ولم تُستبدل الوسائط بنص."
  });
}
