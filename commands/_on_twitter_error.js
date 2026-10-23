/*CMD
  command: /on_twitter_error
  help: التراجع التلقائي بين خوادم Nitter البديلة عند فشل سحب تغريدات تويتر/X
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

// خوادم Nitter البديلة بالترتيب — ملاحظة: خوادم Nitter العامة غير مستقرة بطبيعتها
var instances = ["nitter.poast.org", "nitter.net", "nitter.privacyredirect.com", "xcancel.com"];
var custom = Bot.getProperty("nitter_instances", "");
if (custom) {
  instances = custom.split(",");
}

var next_idx = inst_idx + 1;
if (next_idx >= instances.length) {
  // استنفدنا كل الخوادم — نسجل الملاحظة فقط دون إزعاج
  var fails = Bot.getProperty("tw_fail_count_" + handle, 0) + 1;
  Bot.setProperty("tw_fail_count_" + handle, fails, "integer");
  Bot.setProperty("last_twitter_error_" + handle, {
    university_id: univ_id, failures: fails, at: Date.now(),
    message: "تعذر الجلب من مثيلات Nitter المضبوطة؛ ستعيد المهمة الدورية المحاولة."
  }, "json");
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
