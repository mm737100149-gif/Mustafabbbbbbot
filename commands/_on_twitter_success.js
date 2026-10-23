/*CMD
  command: /on_twitter_success
  help: قراءة موجز X مع دعم CDATA وجميع الصور المتاحة
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
var handle = (parts[1] || "").trim().replace(/^@/, "").toLowerCase();
if (!universityId || !handle) return;

var projects = Bot.getProperty("university_projects", []) || [];
var project = null;
for (var p = 0; p < projects.length; p++) {
  if (projects[p].id === universityId && projects[p].enabled !== false) { project = projects[p]; break; }
}
if (!project) return;
var mapped = false;
var configured = project.twitter_sources || [];
for (var s = 0; s < configured.length; s++) {
  var normalized = String(configured[s]).replace(/^https?:\/\/(?:x|twitter)\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "").toLowerCase();
  if (normalized === handle) mapped = true;
}
if (!mapped) return;

function decodeEntities(text) {
  return String(text || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/gi, " ").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function tag(xml, name) {
  var re = new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + name + ">", "i");
  var match = xml.match(re);
  return match ? match[1].trim() : "";
}
function htmlToText(html) {
  var value = String(html || "").replace(/<br\s*\/?>(?:\s*)/gi, "\n")
    .replace(/<img[^>]*>/gi, " ").replace(/<[^>]+>/g, " ");
  return decodeEntities(value).replace(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)\S*/gi, "")
    .replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function mediaFrom(html) {
  var result = [];
  var re = /<img[^>]+src=["']([^"']+)["']/gi;
  var match;
  while ((match = re.exec(html)) !== null) {
    var url = decodeEntities(match[1]).trim();
    if (url.indexOf("//") === 0) url = "https:" + url;
    // تحويل صورة Nitter الأصلية إلى CDN الرسمي كلما كان المسار معروفًا.
    var original = url.match(/\/pic\/orig\/(.+)$/i);
    if (original) {
      try { url = "https://pbs.twimg.com/" + decodeURIComponent(original[1]); } catch (e) {}
    }
    if (!/^https?:\/\//i.test(url) || /emoji|twemoji|profile_images/i.test(url)) continue;
    if (result.indexOf(url) === -1) result.push(url);
  }
  return result.slice(0, 10);
}

var itemRe = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
var entryRe = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi;
var items = [];
var match;
while ((match = itemRe.exec(content)) !== null && items.length < 30) items.push(match[1]);
if (!items.length) while ((match = entryRe.exec(content)) !== null && items.length < 30) items.push(match[1]);

var accepted = 0;
for (var i = 0; i < items.length && accepted < 12; i++) {
  var xml = items[i];
  var title = htmlToText(tag(xml, "title"));
  var descriptionRaw = tag(xml, "description") || tag(xml, "content");
  var description = htmlToText(descriptionRaw);
  var link = decodeEntities(tag(xml, "link")).trim();
  if (!link) {
    var linkMatch = xml.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (linkMatch) link = decodeEntities(linkMatch[1]);
  }
  var guid = decodeEntities(tag(xml, "guid") || tag(xml, "id") || link).trim();
  var status = (guid + " " + link).match(/\/status(?:es)?\/(\d+)/i);
  var postId = status ? status[1] : (guid || link);
  var text = description || title;
  if (!postId || (!text && !descriptionRaw)) continue;
  var images = mediaFrom(descriptionRaw);
  var media = [];
  for (var z = 0; z < images.length; z++) media.push({ type: "photo", id: images[z] });
  Bot.runCommand("/submit_post", {
    university_id: project.id,
    source_type: "twitter",
    source_id: "@" + handle,
    source_post_id: postId,
    source_url: link || guid,
    raw_text: text,
    media: media,
    notify: false
  });
  accepted++;
}
