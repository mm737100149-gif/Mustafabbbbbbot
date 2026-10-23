/*CMD
  command: /crawl_sources
  help: فحص وسحب المنشورات وتوزيعها على كل جامعة وقناتها المستهدفة حصراً V3.1
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 🔄 سحب وفحص المصادر, سحب المنشورات, /crawl, فحص المصادر, 🔄 سحب وقراءة المنشورات الآن, 🔄 فحص وسحب أخبار الجامعات
CMD*/

var is_paused = Bot.getProperty("bot_paused", false);
if (is_paused) {
  Bot.sendMessage("⏸️ البوت متوقف حالياً. لتشغيل النشر، اضغط زر التشغيل في /start");
  return;
}

// 1. جلب مشاريع الجامعات
var univ_projects = Bot.getProperty("university_projects");
if (!univ_projects || !Array.isArray(univ_projects) || univ_projects.length === 0) {
  var target_ch = Bot.getProperty("target_channels") || "@jhdhhdcj";
  univ_projects = [
    {
      id: "univ_ksu",
      name: "جامعة الملك سعود",
      target_channel: target_ch,
      telegram_sources: ["@KSU_News"],
      twitter_sources: ["@ksu_news"],
      google_news_query: "جامعة الملك سعود",
      google_news_enabled: true,
      keywords: ["جامعة الملك سعود", "الملك سعود", "KSU", "قبول", "تسجيل"],
      enabled: true
    }
  ];
  Bot.setProperty("university_projects", univ_projects, "json");
}

var current_model = Bot.getProperty("ai_model", "DeepSeek-V4-Flash");
Bot.setProperty("auto_crawl_enabled", false, "boolean");

function cleanChannel(ch) {
  if (!ch) return "";
  var s = String(ch).trim();
  s = s.replace(/^https?:\/\/t\.me\/s\//i, "");
  s = s.replace(/^https?:\/\/t\.me\//i, "");
  s = s.replace(/^t\.me\//i, "");
  s = s.replace(/^@/, "");
  s = s.replace(/\/.*$/, "");
  return s.trim();
}

// 52: 
var checked_count = 0;
var status_msg = "🔄 **بدء سحب أخبار الجامعات المطور V4.0**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n";

// خوادم تويتر البديلة (Nitter) لضمان الاستقرار
var twitter_instances = [
  "nitter.poast.org",
  "nitter.net",
  "nitter.privacyredirect.com",
  "nitter.moomoo.me",
  "nitter.it",
  "nitter.esmailelbob.xyz",
  "xcancel.com"
];
var current_instance_idx = Bot.getProperty("nitter_idx", 0);

for (var u = 0; u < univ_projects.length; u++) {
  var univ = univ_projects[u];
  if (!univ.enabled) continue;

  status_msg += "🏛️ **" + univ.name + "**\n";

  // 1. فحص قنوات تيليجرام
  if (univ.telegram_sources && Array.isArray(univ.telegram_sources)) {
    for (var t = 0; t < univ.telegram_sources.length; t++) {
      var ch_name = cleanChannel(univ.telegram_sources[t]);
      if (!ch_name) continue;

      HTTP.get({
        url: "https://t.me/s/" + ch_name,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        success: "/on_crawl_success " + univ.id + "|" + ch_name,
        error: "/on_crawl_error " + ch_name,
        background: true
      });
      checked_count++;
    }
  }

  // 2. فحص حسابات تويتر/X عبر Nitter
  if (univ.twitter_sources && Array.isArray(univ.twitter_sources)) {
    var instance = twitter_instances[current_instance_idx % twitter_instances.length];
    for (var tw = 0; tw < univ.twitter_sources.length; tw++) {
      var handle = univ.twitter_sources[tw].replace("@", "").trim();
      if (!handle) continue;

      HTTP.get({
        url: "https://" + instance + "/" + handle + "/rss",
        success: "/on_crawl_success " + univ.id + "|" + handle,
        error: "/on_crawl_error tw_" + handle,
        background: true
      });
      checked_count++;
    }
  }

  // 3. فحص أخبار جوجل
  if (univ.google_news_enabled) {
    var enc_q = encodeURIComponent(univ.google_news_query || univ.name);
    HTTP.get({
      url: "https://news.google.com/rss/search?q=" + enc_q + "&hl=ar&gl=SA&ceid=SA:ar",
      success: "/on_google_news_success " + univ.id,
      error: "/on_crawl_error gnews_" + univ.id,
      background: true
    });
    checked_count++;
  }
}

// تدوير خادم تويتر للمرة القادمة
Bot.setProperty("nitter_idx", (current_instance_idx + 1), "integer");

status_msg += "\n✅ تم إرسال " + checked_count + " طلب سحب للمصادر المعزولة.";

var kb = [
  [{ title: "🏛️ إدارة الجامعات", command: "/universities" }, { title: "➕ إضافة جامعة", command: "/add_university" }],
  [{ title: "📝 خبر فوري", command: "/new_post" }, { title: "🎛 الرئيسية", command: "/start" }]
];

Bot.sendInlineKeyboard(kb, status_msg);

