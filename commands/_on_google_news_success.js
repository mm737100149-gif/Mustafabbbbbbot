/*CMD
  command: /on_google_news_success
  help: فلترة أخبار جوجل بعنوان دقيق وحداثة زمنية ومنع التكرار
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if (!content) return;
var universityId = (params || "").trim();
if (!universityId) return;
var projects = Bot.getProperty("university_projects", []) || [];
var project = null;
for (var p = 0; p < projects.length; p++) {
  if (projects[p].id === universityId && projects[p].enabled !== false && projects[p].google_news_enabled) {
    project = projects[p]; break;
  }
}
// لا رجوع إلى أول جامعة عند معرف غير صالح.
if (!project) return;

function decode(text) {
  return String(text || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
function tag(xml, name) {
  var match = xml.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + name + ">", "i"));
  return match ? match[1].trim() : "";
}
function norm(text) {
  return decode(text).toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();
}

var generic = ["قبول", "تسجيل", "جامعة", "جامعات", "تعليم", "مواعيد", "نتائج", "منح", "امتحان", "اخبار", "أخبار"];
var aliases = [project.name].concat(project.google_news_aliases || []);
var validAliases = [];
for (var a = 0; a < aliases.length; a++) {
  var alias = norm(aliases[a]);
  if (alias.length >= 3 && generic.indexOf(alias) === -1 && validAliases.indexOf(alias) === -1) validAliases.push(alias);
}
var maxAgeDays = parseInt(Bot.getProperty("google_news_max_age_days", 14), 10) || 14;
var itemRe = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
var match;
var accepted = 0;
while ((match = itemRe.exec(content)) !== null && accepted < 8) {
  var xml = match[1];
  var fullTitle = decode(tag(xml, "title"));
  var link = decode(tag(xml, "link"));
  var pubDate = decode(tag(xml, "pubDate"));
  if (!fullTitle || !link || !pubDate) continue;
  var timestamp = Date.parse(pubDate);
  if (!timestamp || Date.now() - timestamp > maxAgeDays * 86400000 || timestamp > Date.now() + 86400000) continue;
  var titleForMatch = norm(fullTitle);
  var relevant = false;
  for (var k = 0; k < validAliases.length; k++) if (titleForMatch.indexOf(validAliases[k]) !== -1) relevant = true;
  // الكلمات العامة مثل «قبول» و«تسجيل» لا تكفي إطلاقًا.
  if (!relevant) continue;
  var cleanTitle = fullTitle.replace(/\s+-\s+[^-]{1,100}$/, "").trim();
  var publisher = fullTitle.substring(cleanTitle.length).replace(/^\s+-\s+/, "").trim();
  var text = cleanTitle + (publisher ? "\nالمصدر الصحفي: " + publisher : "") + "\n" + link;
  Bot.runCommand("/submit_post", {
    university_id: project.id,
    source_type: "google_news",
    source_id: "google_news:" + project.id,
    source_post_id: link,
    source_url: link,
    raw_text: text,
    media: [],
    notify: false
  });
  accepted++;
}
