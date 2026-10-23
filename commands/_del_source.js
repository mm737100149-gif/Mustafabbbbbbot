/*CMD
  command: /del_source
  help: حذف مصدر من كل المشاريع
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

var projects=Bot.getProperty("university_projects",[])||[];
if(!params){Bot.sendMessage("أرسل /del_source @اسم_المصدر لحذفه من كل مشروع ظاهر فيه.");return;}
var src=params.trim().replace(/^twitter:/i,"").toLowerCase(),count=0;
for(var i=0;i<projects.length;i++){var p=projects[i];for(var k=0;k<2;k++){var key=k?"twitter_sources":"telegram_sources",list=p[key]||[],kept=[];for(var j=0;j<list.length;j++){if(String(list[j]).toLowerCase()===src)count++;else kept.push(list[j]);}p[key]=kept;}}
Bot.setProperty("university_projects",projects,"json");Bot.sendMessage(count?"✅ حُذف المصدر من "+count+" رابط.":"المصدر غير موجود.");
