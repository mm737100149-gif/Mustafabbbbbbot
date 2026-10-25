/*CMD
  command: /on_google_news_success
  help: معالج استلام وتصفية أخبار جوجل نيوز وصياغتها ونشرها بدون تكرار V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

var univ_id = (params || "").trim();
var univ_projects = Bot.getProperty("university_projects", []) || [];
var target_univ = null;

for (var u = 0; u < univ_projects.length; u++) {
  if (univ_projects[u].id === univ_id) {
    target_univ = univ_projects[u];
    break;
  }
}
if (!target_univ) return;

function stripTags(t) {
  if (!t) return "";
  return t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

var safe_content = content.length > 30000 ? content.substring(0, 30000) : content;
var item_chunks = safe_content.split("<item>");

for (var idx = 1; idx < item_chunks.length; idx++) {
  var item_str = item_chunks[idx].split("</item>")[0];

  function grab(tag) {
    var a = item_str.indexOf("<" + tag + ">");
    var b = item_str.indexOf("</" + tag + ">");
    if (a === -1 || b === -1) return "";
    return item_str.substring(a + tag.length + 2, b);
  }

  var raw_title = stripTags(grab("title"));
  var raw_link = stripTags(grab("link"));
  var raw_pubDate = stripTags(grab("pubDate"));

  if (!raw_title || raw_title.length < 5) continue;

  // فحص تاريخ النشر: رفض الأخبار التي مضى عليها أكثر من 30 يوماً
  if (raw_pubDate) {
    var itemDate = new Date(raw_pubDate);
    if (!isNaN(itemDate.getTime())) {
      var ageDays = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > 30) continue;
    }
  }

  // التحقق الصارم من ذكر اسم الجامعة أو أحد أسماءها البديلة في العنوان
  var title_lower = raw_title.toLowerCase();
  var matches_univ = false;
  var univ_name_lower = (target_univ.name || "").toLowerCase().trim();
  if (univ_name_lower && title_lower.indexOf(univ_name_lower) !== -1) {
    matches_univ = true;
  }
  if (!matches_univ && Array.isArray(target_univ.google_news_aliases)) {
    for (var a = 0; a < target_univ.google_news_aliases.length; a++) {
      var alias = (target_univ.google_news_aliases[a] || "").toLowerCase().trim();
      if (alias && title_lower.indexOf(alias) !== -1) {
        matches_univ = true;
        break;
      }
    }
  }
  if (!matches_univ) continue;

  var post_id = raw_link || raw_title;

  Bot.runCommand("/submit_post", {
    university_id: target_univ.id,
    source_type: "google_news",
    source_id: "google_news",
    source_post_id: post_id,
    source_url: raw_link,
    raw_text: raw_title,
    media: []
  });
}
