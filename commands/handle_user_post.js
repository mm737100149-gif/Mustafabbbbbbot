/*CMD
  command: handle_user_post
  help: استقبال المنشورات والوسائط والتعليقات مع توجيه صريح وآمن
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var msg = null;
if (typeof request !== "undefined" && request) {
  msg = request.channel_post || request.message || request.edited_channel_post || request.edited_message || request;
}
if (!msg) return;
var text = String(msg.caption || msg.text || (typeof message !== "undefined" ? message : "") || "").trim();
var chatType = msg.chat ? msg.chat.type : "";
var isPrivate = chatType === "private";
if (isPrivate) {
  var adminIds = Bot.getProperty("admin_ids", [7607633343]) || [7607633343];
  var allowed = false;
  if (user) {
    for (var a = 0; a < adminIds.length; a++) {
      if (String(adminIds[a]) === String(user.telegramid)) allowed = true;
    }
  }
  if (!allowed) return;
}

// الرد على التعليقات يعمل فقط في مجموعة المناقشة التي يحددها المشرف.
var commentsGroup = String(Bot.getProperty("comments_group_id", ""));
if (!isPrivate && Bot.getProperty("comments_enabled", false) && commentsGroup && msg.chat &&
    String(msg.chat.id) === commentsGroup && text && text.indexOf("/") !== 0) {
  if (msg.from && msg.from.is_bot) return;
  var commentKey = "comment_ctx_" + (msg.from ? msg.from.id : "unknown") + "_" + msg.message_id;
  if (Bot.getProperty(commentKey)) return;
  var commentContext = {
    chat_id: msg.chat.id, message_id: msg.message_id,
    user_id: msg.from ? msg.from.id : 0, text: text.substring(0, 6000), created_at: Date.now()
  };
  Bot.setProperty(commentKey, commentContext, "json");
  var apiKey = Bot.getProperty("ai_api_key", "");
  if (!apiKey) {
    Api.sendMessage({ chat_id: msg.chat.id, reply_to_message_id: msg.message_id,
      text: "تعذر الرد الآن لأن خدمة المحادثة غير مضبوطة. حاول لاحقًا." });
    return;
  }
  var history = Bot.getProperty("comment_history_" + commentContext.user_id, []) || [];
  var messages = [{ role: "system", content:
    "أنت مساعد أكاديمي عربي في مجموعة مناقشة طلابية. أجب باختصار ووضوح، ولا تختلق مواعيد أو لوائح أو روابط. " +
    "إذا لم تكن المعلومة متاحة في السياق فقل إنك لا تستطيع تأكيدها ووجه الطالب إلى المصدر الرسمي. لا تستخدم مقدمات مجاملة." }];
  for (var h = 0; h < history.length; h++) messages.push(history[h]);
  messages.push({ role: "user", content: commentContext.text });
  HTTP.post({
    url: Bot.getProperty("ai_base_url", "https://api.openai.com/v1").replace(/\/+$/, "") + "/chat/completions",
    headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
    body: { model: Bot.getProperty("ai_model", "gpt-4o-mini"), messages: messages, temperature: 0.2, max_tokens: 700 },
    success: "/on_comment_ai_success " + commentKey,
    error: "/on_comment_ai_error " + commentKey,
    background: true
  });
  return;
}

// استخراج كل نوع وسائط بمعرفه الأصلي دون تحويله إلى نص.
var media = [];
if (msg.photo && msg.photo.length) media.push({ type: "photo", id: msg.photo[msg.photo.length - 1].file_id });
else if (msg.video && msg.video.file_id) media.push({ type: "video", id: msg.video.file_id });
else if (msg.document && msg.document.file_id) media.push({ type: "document", id: msg.document.file_id });
else if (msg.audio && msg.audio.file_id) media.push({ type: "audio", id: msg.audio.file_id });
else if (msg.voice && msg.voice.file_id) media.push({ type: "voice", id: msg.voice.file_id });
else if (msg.animation && msg.animation.file_id) media.push({ type: "document", id: msg.animation.file_id });
if (!text && !media.length) return;
if (text.indexOf("/") === 0 && !media.length) return;

var projects = Bot.getProperty("university_projects", []) || [];
var enabledProjects = [];
for (var e = 0; e < projects.length; e++) if (projects[e].enabled !== false && projects[e].target_channel) enabledProjects.push(projects[e]);

// منع إعادة التقاط منشورات أي قناة وجهة، لا القناة الافتراضية فقط.
if (chatType === "channel" && msg.chat) {
  var ownChannel = msg.chat.username ? "@" + msg.chat.username.toLowerCase() : String(msg.chat.id);
  for (var own = 0; own < enabledProjects.length; own++) {
    var destination = String(enabledProjects[own].target_channel).toLowerCase();
    if (destination === ownChannel || destination === String(msg.chat.id)) return;
  }
}

var sourceChat = null;
if (chatType === "channel" || chatType === "supergroup") sourceChat = msg.chat;
if (msg.forward_from_chat) sourceChat = msg.forward_from_chat;
if (msg.forward_origin && msg.forward_origin.chat) sourceChat = msg.forward_origin.chat;
if (msg.forward_origin && msg.forward_origin.sender_chat) sourceChat = msg.forward_origin.sender_chat;
var sourceId = "";
if (sourceChat) sourceId = sourceChat.username ? "@" + sourceChat.username : String(sourceChat.id);
var forwarded = !!sourceChat || !!(msg.forward_date || msg.forward_origin || msg.forward_from);

function cleanSource(value) {
  return String(value || "").trim().replace(/^https?:\/\/t\.me\/(?:s\/)?/i, "")
    .replace(/^t\.me\/(?:s\/)?/i, "").replace(/\/.*$/, "").toLowerCase();
}
var project = null;
if (sourceId) {
  for (var p = 0; p < enabledProjects.length; p++) {
    var sources = (enabledProjects[p].telegram_sources || []).concat(enabledProjects[p].twitter_sources || []);
    for (var s = 0; s < sources.length; s++) {
      if (cleanSource(sources[s]) === cleanSource(sourceId)) { project = enabledProjects[p]; break; }
    }
    if (project) break;
  }
}

// المصدر الموجّه غير المربوط يُحجب حتى لو احتوى كلمات جامعية؛ هذا يمنع الترويج والتداخل.
if (forwarded && !project) {
  if (isPrivate) Bot.sendMessage("🛡️ لم يُنشر المنشور لأن مصدره غير مربوط صراحة بجامعة. اربط المصدر أولًا من /universities.");
  return;
}

// النص المباشر قرار يدوي، لكن مع تعدد الجامعات يجب اختيار الوجهة بدل افتراض الأولى.
if (!project && isPrivate) {
  var selectedProjectId = User.getProperty("pending_direct_project", "");
  if (selectedProjectId) {
    for (var sp = 0; sp < enabledProjects.length; sp++) {
      if (enabledProjects[sp].id === selectedProjectId) project = enabledProjects[sp];
    }
    User.setProperty("pending_direct_project", "", "string");
  }
  var lower = text.toLowerCase();
  for (var n = 0; !project && n < enabledProjects.length; n++) {
    if (lower && lower.indexOf(String(enabledProjects[n].name).toLowerCase()) !== -1) { project = enabledProjects[n]; break; }
  }
  if (!project && enabledProjects.length === 1) project = enabledProjects[0];
  if (!project && enabledProjects.length > 1) {
    var pending = { text: text, media: media, source_post_id: String(msg.message_id || Date.now()), created_at: Date.now() };
    User.setProperty("pending_direct_post", pending, "json");
    var buttons = [];
    for (var b = 0; b < enabledProjects.length; b++) {
      buttons.push([{ title: enabledProjects[b].name, command: "/select_direct_project " + enabledProjects[b].id }]);
    }
    Bot.sendInlineKeyboard(buttons, "اختر الجامعة وقناة النشر لهذا المنشور. لن يُختار أي وجهة تلقائيًا:");
    return;
  }
}
if (!project) return;
if (Bot.getProperty("bot_paused", false)) {
  if (isPrivate) Bot.sendMessage("⏸️ النشر متوقف مؤقتًا. استأنفه من /pause ثم أعد إرسال المنشور.");
  return;
}

if (!sourceId) sourceId = "direct:" + (user ? user.telegramid : "admin");
var sourcePostId = String(msg.message_id || Date.now());
if (msg.forward_origin && msg.forward_origin.message_id) sourcePostId = String(msg.forward_origin.message_id);
if (msg.forward_from_message_id) sourcePostId = String(msg.forward_from_message_id);
var submission = {
  university_id: project.id,
  source_type: chatType === "channel" ? "telegram_live" : (forwarded ? "telegram_forward" : "direct"),
  source_id: sourceId,
  source_post_id: sourcePostId,
  source_url: "",
  raw_text: text,
  media: media,
  notify: isPrivate
};

// تجميع الألبوم قبل إرساله حتى لا تتحول صوره إلى منشورات منفصلة مبتورة.
if (msg.media_group_id) {
  var albumKey = "album_" + cleanSource(sourceId).replace(/[^a-z0-9_-]/g, "_") + "_" + msg.media_group_id;
  var album = Bot.getProperty(albumKey, { submission: submission, media: [], text: "" }) || { submission: submission, media: [], text: "" };
  album.submission = submission;
  album.media = album.media.concat(media);
  if (text.length > (album.text || "").length) album.text = text;
  album.submission.source_post_id = String(msg.media_group_id);
  Bot.setProperty(albumKey, album, "json");
  Bot.run({ command: "/flush_album", run_after: 3, label: "flush_" + albumKey, options: { album_key: albumKey } });
  return;
}

Bot.runCommand("/submit_post", submission);
