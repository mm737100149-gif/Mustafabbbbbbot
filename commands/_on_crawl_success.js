/*CMD
  command: /on_crawl_success
  help: قراءة دفعة منشورات قناة تيليجرام العامة مع الوسائط المتاحة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if (!content) return;
var parts = (params || "").split("|");
var universityId = (parts[0] || "").trim();
var channel = (parts[1] || "").trim().replace(/^@/, "").toLowerCase();
if (!universityId || !channel) return;

function cleanChannel(value) {
  return String(value || "").trim().replace(/^https?:\/\/t\.me\/(?:s\/)?/i, "")
    .replace(/^t\.me\/(?:s\/)?/i, "").replace(/^@/, "").replace(/\/.*$/, "").toLowerCase();
}
var projects = Bot.getProperty("university_projects", []) || [];
var project = null;
for (var p = 0; p < projects.length; p++) {
  if (projects[p].id === universityId && projects[p].enabled !== false) { project = projects[p]; break; }
}
if (!project) return;
var mapped = false;
var configured = project.telegram_sources || [];
for (var s = 0; s < configured.length; s++) if (cleanChannel(configured[s]) === channel) mapped = true;
// استجابة غير مرتبطة لا تُرسل إلى أي قناة.
if (!mapped) return;

function decodeEntities(text) {
  return String(text || "").replace(/&nbsp;/gi, " ").replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function htmlToText(html) {
  var value = String(html || "").replace(/<br\s*\/?>(?:\s*)/gi, "\n");
  value = value.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    function(all, href, anchor) {
      var label = htmlToText(anchor).trim();
      var cleanHref = decodeEntities(href);
      if (!label || label === cleanHref) return cleanHref;
      return label + "\n" + cleanHref;
    });
  value = value.replace(/<[^>]+>/g, " ");
  return decodeEntities(value).replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function photosFrom(chunk) {
  var photos = [];
  var re = /background-image\s*:\s*url\((?:'|")?([^)'"]+)(?:'|")?\)/gi;
  var match;
  while ((match = re.exec(chunk)) !== null) {
    var url = decodeEntities(match[1]).trim();
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (/^https?:\/\//i.test(url) && !/emoji|website_icon|telegram\.org\/img/i.test(url) && photos.indexOf(url) === -1) photos.push(url);
  }
  return photos.slice(0, 10);
}

var marker = /data-post=["']([^"']+)["']/g;
var matches = [];
var m;
while ((m = marker.exec(content)) !== null && matches.length < 40) {
  var idParts = m[1].split("/");
  var numericId = parseInt(idParts[idParts.length - 1], 10);
  if (numericId) matches.push({ full: m[1], id: numericId, index: m.index });
}
matches.sort(function(a, b) { return a.id - b.id; });
var cursorKey = "last_crawl_id_" + channel;
var storedCursor = Bot.getProperty(cursorKey);
// أول فحص يؤسس نقطة البداية فقط، حتى لا يغرق القناة بأرشيف قديم.
if ((storedCursor === null || typeof storedCursor === "undefined") && matches.length) {
  Bot.setProperty(cursorKey, matches[matches.length - 1].id, "integer");
  return;
}
var cursor = parseInt(storedCursor, 10) || 0;
var accepted = 0;
for (var i = 0; i < matches.length && accepted < 12; i++) {
  var item = matches[i];
  if (cursor && item.id <= cursor) continue;
  var end = i + 1 < matches.length ? matches[i + 1].index : Math.min(content.length, item.index + 60000);
  // matches مرتبة بالمعرف لا بموقع HTML؛ نبحث عن العلامة التالية فعليًا.
  var nextMarker = content.indexOf("data-post=", item.index + 10);
  if (nextMarker !== -1) end = nextMarker;
  var chunk = content.substring(item.index, end);
  var textMatch = chunk.match(/<div[^>]+class=["'][^"']*tgme_widget_message_text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  var text = textMatch ? htmlToText(textMatch[1]) : "";
  var urls = photosFrom(chunk);
  var media = [];
  for (var z = 0; z < urls.length; z++) media.push({ type: "photo", id: urls[z] });
  if (!text && !media.length) continue;
  Bot.runCommand("/submit_post", {
    university_id: project.id,
    source_type: "telegram",
    source_id: "@" + channel,
    source_post_id: String(item.id),
    source_url: "https://t.me/" + item.full,
    raw_text: text,
    media: media,
    notify: false
  });
  accepted++;
}
