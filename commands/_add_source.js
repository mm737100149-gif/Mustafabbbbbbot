/*CMD
  command: /add_source
  help: إضافة مصادر إلى مشروع محدد
  need_reply: true
  auto_retry_time:
  folder:
  answer: أرسل: معرف_المشروع = @مصدر1 twitter:@حساب_X
  keyboard:
  aliases:
CMD*/

var adminIds = Bot.getProperty("admin_ids", [7607633343]) || [7607633343];
var isAdmin = false;
if (user) { for (var a = 0; a < adminIds.length; a++) if (String(adminIds[a]) === String(user.telegramid)) isAdmin = true; }
if (!isAdmin) { Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط."); return; }

if(!message||message.trim()==="/cancel"){Bot.sendMessage("أُلغيت العملية.");return;}
var parts=message.split("=");
if(parts.length<2){Bot.sendMessage("حدد المشروع صراحة: univ_id = @source twitter:@account");Bot.runCommand("/add_source");return;}
var id=parts[0].trim(),tokens=parts.slice(1).join("=").split(/[\s,;]+/),projects=Bot.getProperty("university_projects",[])||[],project=null;
for(var p=0;p<projects.length;p++)if(projects[p].id===id){project=projects[p];break;}
if(!project){Bot.sendMessage("المشروع غير موجود. اختره من /universities");return;}
var added=0;
for(var i=0;i<tokens.length;i++){var t=tokens[i].trim();if(!t)continue;var isTw=/^twitter:/i.test(t);var src=isTw?t.replace(/^twitter:/i,""):t;var list=isTw?(project.twitter_sources=project.twitter_sources||[]):(project.telegram_sources=project.telegram_sources||[]);if(list.indexOf(src)===-1){list.push(src);added++;}}
project.telegram_sources=project.telegram_sources||[];project.twitter_sources=project.twitter_sources||[];
Bot.setProperty("university_projects",projects,"json");Bot.sendMessage("✅ أُضيف "+added+" مصدر إلى "+project.name+" فقط.");Bot.runCommand("/univ_view "+id);
