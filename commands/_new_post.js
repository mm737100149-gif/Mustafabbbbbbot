/*CMD
  command: /new_post
  help: بدء نشر يدوي آمن
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var ids=Bot.getProperty("admin_ids",[7607633343])||[7607633343],ok=false;if(user){for(var i=0;i<ids.length;i++)if(String(ids[i])===String(user.telegramid))ok=true;}if(!ok){Bot.sendMessage("هذا الأمر مخصص للمشرف فقط.");return;}
User.setProperty("pending_direct_project","","string");Bot.sendMessage("أرسل النص أو الوسائط. إذا وُجد أكثر من مشروع فسيُطلب اختيار الوجهة صراحة. أرسل /cancel للإلغاء.");Bot.run({command:"/receive_new_post"});
