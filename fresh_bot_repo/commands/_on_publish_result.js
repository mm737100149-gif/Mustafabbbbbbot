/*CMD
  command: /on_publish_result
  help: تأكيد نجاح جزء النشر والانتقال إلى الجزء التالي
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if (!options || !options.bb_options || !options.bb_options.job_id) return;
var jobId = String(options.bb_options.job_id);
var key = "publish_job_" + jobId;
var job = Bot.getProperty(key);
if (!job) return;

if (job.step === "media") {
  job.media_index = (job.media_index || 0) + 1;
  if (job.media_index >= (job.media || []).length) {
    job.step = "text";
    job.text_index = job.text_chunks && job.text_chunks.length ? 1 : 0;
  }
} else {
  job.text_index = (job.text_index || 0) + 1;
}
job.status = "ready";
job.last_error = "";
Bot.setProperty(key, job, "json");
Bot.runCommand("/publish_next", { job_id: jobId });
