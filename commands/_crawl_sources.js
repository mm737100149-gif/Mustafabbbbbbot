/*CMD
  command: /crawl_sources
  help: جلب كل المصادر يدويًا أو بجدولة
  need_reply: false
  auto_retry_time: 300
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if(user){var adminIds = Bot.getProperty("admin_ids", [7607633343]) || [7607633343];
var isAdmin = false;
if (user) { for (var a = 0; a < adminIds.length; a++) if (String(adminIds[a]) === String(user.telegramid)) isAdmin = true; }
if (!isAdmin) { Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط."); return; }

}
var isPaused=Bot.getProperty("bot_paused",false);if(isPaused){if(user)Bot.sendMessage("النشر متوقف مؤقتًا.");return;}
var projects=Bot.getProperty("university_projects",[])||[],only=(params||"").trim(),count=0;
function clean(v){return String(v||"").trim().replace(/^https?:\/\/t\.me\/(?:s\/)?/i,"").replace(/^t\.me\/(?:s\/)?/i,"").replace(/^https?:\/\/(?:x|twitter)\.com\//i,"").replace(/^@/,"").replace(/\/.*$/,"");}
for(var i=0;i<projects.length;i++){var p=projects[i];if(p.enabled===false||(only&&p.id!==only))continue;var tg=p.telegram_sources||[],tw=p.twitter_sources||[];
for(var t=0;t<tg.length;t++){var ch=clean(tg[t]);if(!ch)continue;HTTP.get({url:"https://t.me/s/"+ch,headers:{"User-Agent":"Mozilla/5.0"},success:"/on_crawl_success "+p.id+"|"+ch,error:"/on_crawl_error "+ch,background:true});count++;}
for(var x=0;x<tw.length;x++){var handle=clean(tw[x]);if(!handle)continue;var base=Bot.getProperty("nitter_instance","nitter.poast.org");HTTP.get({url:"https://"+base+"/"+handle+"/rss",headers:{"User-Agent":"Mozilla/5.0"},success:"/on_twitter_success "+p.id+"|"+handle,error:"/on_twitter_error "+p.id+"|"+handle+"|0",background:true});count++;}
if(p.google_news_enabled){var q=encodeURIComponent(p.google_news_query||p.name);HTTP.get({url:"https://news.google.com/rss/search?q="+q+"&hl=ar&gl=SA&ceid=SA:ar",success:"/on_google_news_success "+p.id,error:"/on_crawl_error gnews_"+p.id,background:true});count++;}}
if(user){Bot.sendMessage(count?"أُرسل "+count+" طلب جلب. ستُعالج النتائج ولا يُسجّل نشر قبل تأكيد تيليجرام.":"لا توجد مصادر مفعّلة للفحص.");if(only)Bot.runCommand("/univ_view "+only);}
