/*CMD
  command: /on_twitter_error
  help: التراجع التلقائي بين خوادم Nitter البديلة عند تعذر استجابة خادم V4.0
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

// params = univ_id|handle|instance_index
var raw_params = (params || "").trim();
var p_parts = raw_params.split("|");
var univ_id = p_parts[0] ? p_parts[0].trim() : "";
var handle = p_parts[1] ? p_parts[1].trim().toLowerCase() : "";
var inst_idx = parseInt(p_parts[2] || "0", 10);
if (!handle) return;

// خوادم Nitter البديلة النشطة
var instances = ["xcancel.com", "nitter.poast.org", "nitter.privacyredirect.com", "nitter.spaceint.fr", "nitter.tiekoetter.com"];
var custom = Bot.getProperty("nitter_instances", "");
if (custom) {
  instances = custom.split(",");
}

var next_idx = inst_idx + 1;
if (next_idx >= instances.length) {
  return;
}

var inst = instances[next_idx].trim();
HTTP.get({
  url: "https://" + inst + "/" + handle + "/rss",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml,application/xml;q=0.9,*/*;q=0.8"
  },
  success: "/on_twitter_success " + univ_id + "|" + handle,
  error: "/on_twitter_error " + univ_id + "|" + handle + "|" + next_idx,
  background: true
});
