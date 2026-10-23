/*CMD
  command: /univ_post
  help: نشر يدوي في مشروع محدد
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var ids=Bot.getProperty("admin_ids",[7607633343])||[7607633343],ok=false;if(user){for(var i=0;i<ids.length;i++)if(String(ids[i])===String(user.telegramid))ok=true;}if(!ok){Bot.sendMessage("هذا الأمر مخصص للمشرف فقط.");return;}
var id=(params||"").trim(),projects=Bot.getProperty("university_projects",[])||[],found=false;for(var i=0;i<projects.length;i++)if(projects[i].id===id&&projects[i].enabled!==false)found=true;if(!found){Bot.sendMessage("المشروع غير موجود أو متوقف.");return;}User.setProperty("pending_direct_project",id,"string");Bot.sendMessage("أرسل المنشور الآن؛ الوجهة محددة صراحة وستظهر رسالة تأكيد مختصرة فقط.");Bot.run({command:"/receive_new_post"});
