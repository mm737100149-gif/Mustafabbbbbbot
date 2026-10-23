/*CMD
  command: /add_univ_step5
  help: معالج الإضافة — حفظ المشروع
  need_reply: true
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

var wizard=User.getProperty("univ_wizard");
if (!wizard || wizard.step!==5) { Bot.sendMessage("انتهت جلسة الإعداد. ابدأ من /add_university"); return; }
if (!message || message.trim()==="/cancel") { User.setProperty("univ_wizard",null,"json"); Bot.sendMessage("أُلغي المعالج."); return; }
var input=message.trim();
wizard.google_news_enabled=!/^(?:تخطي|skip|لا)$/i.test(input);
wizard.google_news_query=/^(?:تلقائي|auto|نعم)$/i.test(input)?wizard.name:input;
wizard.id="univ_"+Date.now().toString(36);
wizard.enabled=true; wizard.created_at=new Date().toISOString();
var projects=Bot.getProperty("university_projects",[])||[];
var duplicate=false;
for (var i=0;i<projects.length;i++) if (String(projects[i].target_channel).toLowerCase()===String(wizard.target_channel).toLowerCase() && projects[i].name===wizard.name) { wizard.id=projects[i].id; projects[i]=wizard; duplicate=true; }
if (!duplicate) projects.push(wizard);
Bot.setProperty("university_projects",projects,"json");
User.setProperty("univ_wizard",null,"json");
Bot.sendMessage("✅ تم حفظ المشروع: "+wizard.name+"\nالوجهة: "+wizard.target_channel+"\nGoogle News: "+(wizard.google_news_enabled?"مفعّل بانتقائية":"معطّل"));
Bot.runCommand("/univ_view "+wizard.id);
