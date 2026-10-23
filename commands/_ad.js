/*CMD
  command: /ad
  help: عرض وتعديل إعلان خدمات الطلاب البديل
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 🎯 إعلان خدماتي البديل, /advertisement
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
Bot.sendMessage("أُوقفت ميزة استبدال إعلانات الآخرين. النظام يحجب المنشور الترويجي ولا يستبدله بإعلان آخر.");
