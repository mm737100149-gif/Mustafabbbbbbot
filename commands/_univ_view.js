/*CMD
  command: /univ_view
  help: عرض مشروع محدد
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var adminIds = Bot.getProperty("admin_ids", [7607633343]) || [7607633343];
var isAdmin = false;
if (user) { for (var a = 0; a < adminIds.length; a++) if (String(adminIds[a]) === String(user.telegramid)) isAdmin = true; }
if (!isAdmin) { Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط."); return; }

var id=(params||"").trim(),projects=Bot.getProperty("university_projects",[])||[],project=null;for(var i=0;i<projects.length;i++)if(projects[i].id===id){project=projects[i];break;}if(!project){Bot.sendMessage("المشروع غير موجود. اختره من /universities");return;}var text="🏛️ "+project.name+"\nالوجهة: "+project.target_channel+"\nتيليجرام: "+((project.telegram_sources||[]).join("، ")||"لا يوجد")+"\nX: "+((project.twitter_sources||[]).join("، ")||"لا يوجد")+"\nGoogle News: "+(project.google_news_enabled?(project.google_news_query||project.name):"معطّل")+"\nوصف المصدر: "+(project.source_profile||"غير مضاف");var kb=[[{title:"فحص كل المصادر",command:"/univ_crawl "+id},{title:project.enabled!==false?"إيقاف":"تفعيل",command:"/univ_toggle "+id}],[{title:"إضافة مصادر",command:"/add_source"},{title:"وصف المصدر",command:"/set_source_profile "+id}],[{title:"نشر يدوي",command:"/univ_post "+id},{title:"حذف",command:"/del_mapping "+id}]];Bot.sendInlineKeyboard(kb,text);
