/*CMD
  command: /google_news
  help: بحث وسحب أحدث الأخبار الأكاديمية الرسمية من جوجل نيوز لجامعة محددة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 🌐 بحث أخبار جوجل للجامعة, /gnews, /univ_gnews
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
var id=(params||"").trim();if(!id){Bot.sendMessage("حدد مشروعًا من /universities؛ لا يوجد اختيار تلقائي لأول جامعة.");return;}var projects=Bot.getProperty("university_projects",[])||[],found=false;for(var i=0;i<projects.length;i++)if(projects[i].id===id&&projects[i].enabled!==false)found=true;if(!found){Bot.sendMessage("المشروع غير موجود أو متوقف.");return;}Bot.runCommand("/crawl_sources "+id);
