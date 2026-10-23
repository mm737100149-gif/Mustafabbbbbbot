/*CMD
  command: /ai
  help: إعدادات الذكاء الاصطناعي واختيار النموذج
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: ⚙️ إعدادات الذكاء الاصطناعي, /model
CMD*/

var ids=Bot.getProperty("admin_ids",[7607633343])||[7607633343],ok=false;if(user){for(var i=0;i<ids.length;i++)if(String(ids[i])===String(user.telegramid))ok=true;}if(!ok){Bot.sendMessage("هذا الأمر مخصص للمشرف فقط.");return;}
var key=Bot.getProperty("ai_api_key","");var text="⚙️ إعدادات الذكاء\nالبوابة: "+Bot.getProperty("ai_base_url","https://api.openai.com/v1")+"\nالنموذج: "+Bot.getProperty("ai_model","gpt-4o-mini")+"\nالمفتاح: "+(key?"مضبوط ومخفي":"غير مضبوط")+"\nالصياغة: "+(Bot.getProperty("ai_enabled",true)?"مفعّلة":"معطّلة")+"\nعند غياب المفتاح أو فشل الخدمة يُستخدم تنظيف محلي دون اختلاق محتوى.";var kb=[[{title:"تعديل النموذج",command:"/set_model"},{title:"تعديل البوابة",command:"/set_base_url"}],[{title:"تعديل المفتاح",command:"/set_api_key"},{title:"تفعيل/تعطيل",command:"/toggle_ai"}],[{title:"تعليمات التحرير",command:"/instructions"}]];Bot.sendInlineKeyboard(kb,text);
