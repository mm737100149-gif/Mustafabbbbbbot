/*CMD
  command: /del_university
  help: حذف مشروع محدد
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

var id=(params||message||"").trim();if(!id||id==="/cancel"){Bot.sendMessage("أرسل معرف المشروع من /universities");return;}var projects=Bot.getProperty("university_projects",[])||[],kept=[],name="";for(var i=0;i<projects.length;i++){if(projects[i].id===id)name=projects[i].name;else kept.push(projects[i]);}if(!name){Bot.sendMessage("المشروع غير موجود.");return;}Bot.setProperty("university_projects",kept,"json");Bot.sendMessage("✅ حُذف "+name);Bot.runCommand("/universities");
