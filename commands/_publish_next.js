/*CMD
  command: /publish_next
  help: إرسال الوسائط والنص على مراحل مع انتظار تأكيد تيليجرام
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if (!options || !options.job_id) return;
var jobId = String(options.job_id);
var key = "publish_job_" + jobId;
var job = Bot.getProperty(key);
if (!job || Bot.getProperty("publication_v2_" + jobId)) return;

function toHtml(text) {
  var s = String(text || "");
  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s.replace(/\*\*([^\n*][\s\S]*?[^\n*])\*\*/g, "<b>$1</b>");
  s = s.replace(/__([^\n_][\s\S]*?[^\n_])__/g, "<u>$1</u>");
  return s;
}
function splitText(text, size) {
  var value = String(text || "").trim();
  var chunks = [];
  while (value.length > size) {
    var cut = value.lastIndexOf("\n", size);
    if (cut < Math.floor(size * 0.55)) cut = value.lastIndexOf(" ", size);
    if (cut < Math.floor(size * 0.4)) cut = size;
    chunks.push(value.substring(0, cut).trim());
    value = value.substring(cut).trim();
  }
  if (value) chunks.push(value);
  return chunks;
}
function notify(job, text) {
  if (!job.notify) return;
  var adminId = Bot.getProperty("admin_id", 7607633343);
  if (adminId) Api.sendMessage({ chat_id: adminId, text: text });
}

var media = Array.isArray(job.media) ? job.media : [];
if (!job.text_chunks) {
  job.text_chunks = splitText(job.formatted_text || job.raw_text || "", media.length ? 800 : 3000);
  Bot.setProperty(key, job, "json");
}

var mediaDone = !media.length || job.media_index >= media.length;
var firstTextIndex = media.length && job.text_chunks.length ? 1 : 0;
var textDone = mediaDone && job.text_index >= job.text_chunks.length;
if (mediaDone && job.step === "media") {
  job.step = "text";
  job.text_index = firstTextIndex;
  textDone = job.text_index >= job.text_chunks.length;
}

// لا تُحسم المهمة إلا بعد نتيجة ناجحة لكل جزء.
if (mediaDone && textDone) {
  Bot.setProperty("publication_v2_" + jobId, {
    published_at: Date.now(), source_type: job.source_type,
    source_id: job.source_id, source_post_id: job.source_post_id,
    target_channel: job.target_channel, formatting_mode: job.formatting_mode
  }, "json");
  Bot.setProperty(key, null, "json");
  var queue = Bot.getProperty("pending_publish_jobs", []) || [];
  var newQueue = [];
  for (var q = 0; q < queue.length; q++) if (queue[q] !== jobId) newQueue.push(queue[q]);
  Bot.setProperty("pending_publish_jobs", newQueue, "json");
  Bot.setProperty("total_published", Bot.getProperty("total_published", 0) + 1, "integer");
  if (job.source_type === "telegram" && /^\d+$/.test(String(job.source_post_id))) {
    var sourceName = String(job.source_id).replace(/^@/, "").toLowerCase();
    var oldCursor = parseInt(Bot.getProperty("last_crawl_id_" + sourceName, 0), 10) || 0;
    var newCursor = parseInt(job.source_post_id, 10);
    if (newCursor > oldCursor) Bot.setProperty("last_crawl_id_" + sourceName, newCursor, "integer");
  }
  var confirmation = "✅ تم النشر بنجاح في " + job.target_channel + "\nالمصدر: " + job.source_id + "\nلم تُفقد الوسائط ولم يُسجّل النشر إلا بعد تأكيد تيليجرام.";
  if (job.formatting_mode === "local_after_ai_error") confirmation += "\n⚠️ تعذر الذكاء الاصطناعي؛ استُخدم تنظيف محلي دون إضافة محتوى.";
  notify(job, confirmation);
  return;
}

job.status = "publishing";
Bot.setProperty(key, job, "json");
var request = {
  chat_id: job.target_channel,
  on_result: "/on_publish_result",
  on_error: "/on_publish_error",
  bb_options: { job_id: jobId }
};

if (!mediaDone) {
  var item = media[job.media_index];
  if (!item || !item.id) {
    Bot.runCommand("/on_publish_error", { job_id: jobId, error: "معرف وسائط مفقود" });
    return;
  }
  if (job.media_index === 0 && job.text_chunks.length) {
    request.caption = toHtml(job.text_chunks[0]);
    request.parse_mode = "HTML";
  }
  if (item.type === "photo") {
    request.photo = item.id;
    Api.sendPhoto(request);
  } else if (item.type === "video") {
    request.video = item.id;
    Api.sendVideo(request);
  } else if (item.type === "audio") {
    request.audio = item.id;
    Api.sendAudio(request);
  } else if (item.type === "voice") {
    request.voice = item.id;
    Api.sendVoice(request);
  } else {
    request.document = item.id;
    Api.sendDocument(request);
  }
  return;
}

request.text = toHtml(job.text_chunks[job.text_index]);
request.parse_mode = "HTML";
request.disable_web_page_preview = true;
Api.sendMessage(request);
