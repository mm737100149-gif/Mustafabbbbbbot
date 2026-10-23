/*CMD
  command: /universities
  help: إدارة وتوزيع مشاريع الجامعات وقنوات النشر المستقلة بنظام العزل التام
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 🏛️ إدارة الجامعات والمصادر, 🏛️ إدارة الجامعات وقنوات النشر, إدارة الجامعات, الجامعات, /univ, /mapping, 🔗 ربط القنوات والأهداف
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
var projects=Bot.getProperty("university_projects",[])||[],buttons=[];for(var i=0;i<projects.length;i++)buttons.push([{title:projects[i].name,command:"/univ_view "+projects[i].id}]);buttons.push([{title:"➕ إضافة مشروع",command:"/add_university"}]);Bot.sendInlineKeyboard(buttons,projects.length?"اختر مشروعًا لإدارته:":"لا توجد مشاريع بعد.");
