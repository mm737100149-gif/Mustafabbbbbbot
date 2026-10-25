/*CMD
  command: /on_twitter_success
  help: معالج استلام تغريدات تويتر/X من Nitter RSS وصياغتها ونشرها في قناة الجامعة حصراً مع الصور V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

if (!content) return;

// params = univ_id|handle
var raw_params = (params || "").trim();
var p_parts = raw_params.split("|");
var univ_id = p_parts[0] ? p_parts[0].trim() : "";
var handle = p_parts[1] ? p_parts[1].trim().toLowerCase().replace(/^@/, "") : "";
if (!handle) return;

var univ_projects = Bot.getProperty("university_projects", []) || [];
var target_univ = null;
for (var u = 0; u < univ_projects.length; u++) {
  if (univ_projects[u].id === univ_id) {
    target_univ = univ_projects[u];
    break;
  }
}

if (!target_univ) {
  for (var u2 = 0; u2 < univ_projects.length; u2++) {
    var tw_list = univ_projects[u2].twitter_sources || [];
    for (var s = 0; s < tw_list.length; s++) {
      if (tw_list[s].replace(/^@/, "").toLowerCase() === handle) {
        target_univ = univ_projects[u2];
        break;
      }
    }
    if (target_univ) break;
  }
}

if (!target_univ) return;

function stripHtml(html) {
  if (!html) return "";
  var s = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
  s = s.replace(/<br\s*[\/]?>/gi, "\n");
  s = s.replace(/<p[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/\s+/g, " ");
  return s.trim();
}

function extractImages(xmlChunk) {
  if (!xmlChunk) return [];
  var images = [];
  var seen = {};

  function addImg(rawUrl) {
    if (!rawUrl || rawUrl.indexOf("emoji") !== -1) return;
    var u = rawUrl.trim();
    if (u.indexOf("//") === 0) u = "https:" + u;
    try {
      var decoded = decodeURIComponent(u);
      var mMatch = decoded.match(/media\/([^?#"'<>]+)/i);
      if (mMatch && mMatch[1]) {
        u = "https://pbs.twimg.com/media/" + mMatch[1];
      }
    } catch (e) {}

    if (!seen[u]) {
      seen[u] = true;
      images.push({ type: "photo", id: u });
    }
  }

  // 1. وسوم enclosure
  var encMatches = xmlChunk.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/gi) || [];
  for (var i = 0; i < encMatches.length; i++) {
    var uMatch = encMatches[i].match(/url=["']([^"']+)["']/i);
    if (uMatch && uMatch[1]) addImg(uMatch[1]);
  }

  // 2. وسوم media:content
  var mediaMatches = xmlChunk.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/gi) || [];
  for (var j = 0; j < mediaMatches.length; j++) {
    var mU = mediaMatches[j].match(/url=["']([^"']+)["']/i);
    if (mU && mU[1]) addImg(mU[1]);
  }

  // 3. وسوم img داخل الوصف
  var imgMatches = xmlChunk.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
  for (var k = 0; k < imgMatches.length; k++) {
    var iU = imgMatches[k].match(/src=["']([^"']+)["']/i);
    if (iU && iU[1]) addImg(iU[1]);
  }

  return images;
}

var safe_content = content.length > 35000 ? content.substring(0, 35000) : content;
var item_chunks = safe_content.split("<item>");

for (var idx = 1; idx < item_chunks.length; idx++) {
  var item_str = item_chunks[idx].split("</item>")[0];

  function grab(tag) {
    var a = item_str.indexOf("<" + tag + ">");
    var b = item_str.indexOf("</" + tag + ">");
    if (a === -1 || b === -1) return "";
    return item_str.substring(a + tag.length + 2, b);
  }

  var raw_title = stripHtml(grab("title"));
  var raw_desc = stripHtml(grab("description"));
  var raw_link = stripHtml(grab("link"));
  var raw_guid = stripHtml(grab("guid")) || raw_link;
  var media_items = extractImages(item_str);

  var post_text = raw_desc || raw_title;
  var statusMatch = (raw_guid || raw_link).match(/status\/(\d+)/);
  var status_id = statusMatch ? statusMatch[1] : (raw_guid || raw_link);

  Bot.runCommand("/submit_post", {
    university_id: target_univ.id,
    source_type: "twitter",
    source_id: "@" + handle,
    source_post_id: status_id,
    source_url: raw_link || raw_guid,
    raw_text: post_text,
    media: media_items
  });
}
