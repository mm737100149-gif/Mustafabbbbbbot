/*CMD
  command: /sources
  help: عرض وإدارة مصادر المراقبة والقنوات الخارجية
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 📋 إدارة المصادر, المصادر, /channels_list, 📋 قائمة المصادر
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
Bot.runCommand("/mapping");
