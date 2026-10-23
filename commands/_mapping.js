/*CMD
  command: /mapping
  help: عرض الربط من المشاريع الفعلية
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

var projects=Bot.getProperty("university_projects",[])||[];var text="🗺️ الروابط الفعلية المستخدمة في الجلب والنشر:\n";
if(!projects.length)text+="لا توجد مشاريع. استخدم /add_university";
for(var i=0;i<projects.length;i++){var p=projects[i];text+="\n"+(i+1)+". "+p.name+" → "+p.target_channel+" ("+(p.enabled!==false?"مفعّل":"متوقف")+")\nتيليجرام: "+((p.telegram_sources||[]).join("، ")||"لا يوجد")+"\nX: "+((p.twitter_sources||[]).join("، ")||"لا يوجد")+"\nالمعرف: "+p.id+"\n";}
Bot.sendMessage(text);
