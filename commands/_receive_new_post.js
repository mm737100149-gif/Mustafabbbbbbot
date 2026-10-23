/*CMD
  command: /receive_new_post
  help: استلام النشر اليدوي
  need_reply: true
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

var ids=Bot.getProperty("admin_ids",[7607633343])||[7607633343],ok=false;if(user){for(var i=0;i<ids.length;i++)if(String(ids[i])===String(user.telegramid))ok=true;}if(!ok){Bot.sendMessage("هذا الأمر مخصص للمشرف فقط.");return;}
if(message&&message.trim()==="/cancel"){User.setProperty("pending_direct_project","","string");Bot.sendMessage("أُلغي النشر.");return;}Bot.runCommand("handle_user_post");
