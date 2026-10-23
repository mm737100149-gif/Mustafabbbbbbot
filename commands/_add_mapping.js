/*CMD
  command: /add_mapping
  help: إضافة ربط صريح إلى مشروع حقيقي
  need_reply: true
  auto_retry_time:
  folder:
  answer: أرسل: @القناة_الهدف = @مصدر1 @مصدر2 — لإضافة حساب X اكتب twitter:@account
  keyboard:
  aliases:
CMD*/

var adminIds = Bot.getProperty("admin_ids", [7607633343]) || [7607633343];
var isAdmin = false;
if (user) { for (var a = 0; a < adminIds.length; a++) if (String(adminIds[a]) === String(user.telegramid)) isAdmin = true; }
if (!isAdmin) { Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط."); return; }

if (!message || message.trim()==="/cancel") { Bot.sendMessage("أُلغيت العملية."); return; }
var parts=message.split("=");
if (parts.length<2 || !parts[0].trim() || !parts[1].trim()) { Bot.sendMessage("الصيغة غير صحيحة. مثال: @target = @source twitter:@account"); Bot.runCommand("/add_mapping"); return; }
var target=parts[0].trim();
if (target[0]!=="@" && target.indexOf("-100")!==0) target="@"+target;
var tokens=parts.slice(1).join("=").split(/[\s,;]+/),tg=[],tw=[];
for (var i=0;i<tokens.length;i++) { var t=tokens[i].trim(); if(!t)continue; if(/^twitter:/i.test(t)){tw.push(t.replace(/^twitter:/i,""));}else{tg.push(t);} }
if (!tg.length&&!tw.length) { Bot.sendMessage("لم يتم إدخال مصادر صالحة."); return; }
var projects=Bot.getProperty("university_projects",[])||[],project=null;
for(var p=0;p<projects.length;p++) if(String(projects[p].target_channel).toLowerCase()===target.toLowerCase()){project=projects[p];break;}
if(project){project.telegram_sources=(project.telegram_sources||[]).concat(tg);project.twitter_sources=(project.twitter_sources||[]).concat(tw);}else{project={id:"univ_"+Date.now().toString(36),name:target,target_channel:target,telegram_sources:tg,twitter_sources:tw,google_news_enabled:false,enabled:true,created_at:new Date().toISOString()};projects.push(project);}
Bot.setProperty("university_projects",projects,"json");
Bot.sendMessage("✅ حُفظ الربط في مشروع "+project.id+". لن تُرسل هذه المصادر إلى قناة أخرى.");
Bot.runCommand("/univ_view "+project.id);
