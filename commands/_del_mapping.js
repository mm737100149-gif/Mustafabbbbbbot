/*CMD
  command: /del_mapping
  help: حذف مشروع وربطه الفعلي
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
if(!params){var buttons=[];for(var i=0;i<projects.length;i++)buttons.push([{title:"حذف "+projects[i].name,command:"/del_mapping "+projects[i].id}]);Bot.sendInlineKeyboard(buttons,"اختر المشروع الذي تريد حذفه:");return;}
var kept=[],deleted="";for(var j=0;j<projects.length;j++){if(projects[j].id===params.trim())deleted=projects[j].name;else kept.push(projects[j]);}
if(!deleted){Bot.sendMessage("المشروع غير موجود.");return;}Bot.setProperty("university_projects",kept,"json");Bot.sendMessage("✅ حُذف "+deleted);Bot.runCommand("/mapping");
