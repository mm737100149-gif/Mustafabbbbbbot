/*CMD
  command: /social
  help: قنواتنا الرسمية وروابط التواصل الاجتماعي والأكاديمي
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 🌐 قنواتنا وروابط التواصل, قنواتنا وروابط التواصل, روابط التواصل, روابط التواصل الاجتماعي, /social, روابطنا, القنوات الرسمية
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}


var ADMIN_USER = "M_S_F_G";
var univ_projects = Bot.getProperty("university_projects", []);

var text = "🌐 **قنواتنا الرسمية وشبكات التواصل الاجتماعي والأكاديمي**:\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📌 **قنوات النشر الأكاديمية والجامعية النشطة**:\n";

if (univ_projects && Array.isArray(univ_projects) && univ_projects.length > 0) {
  for (var i = 0; i < univ_projects.length; i++) {
    var u = univ_projects[i];
    var ch = u.target_channel || "@your_channel";
    var clean_ch = ch.replace(/^@/, "");
    text += "• **" + u.name + "**: [" + ch + "](https://t.me/" + clean_ch + ")\n";
  }
} else {
  text += "• **قناة الخدمات والأخبار الأكاديمية**: [@your_channel](https://t.me/jhdhhdcj)\n";
}

text += "\n👤 **حساب المشرف العام والخدمات الطلابية**: [@" + ADMIN_USER + "](https://t.me/" + ADMIN_USER + ")\n" +
  "🤖 **بوت النشر والأتمتة الذكي**: [@admiuin_bot](https://t.me/admiuin_bot)\n" +
  "🎓 **مجتمع الطلاب والمناقشات**: متاح لجميع الطلبة للاستفسارات الأكاديمية ومشاريع التخرج\n\n" +
  "━━━━━━━━━━━━━━━━━━━\n" +
  "👇 **روابط سريعة ومباشرة:**";

var inline_keyboard = [
  [
    { title: "📢 قناة النشر المعتمدة @your_channel", url: "https://t.me/jhdhhdcj" },
    { title: "👤 تواصل مع المشرف @" + ADMIN_USER, url: "https://t.me/" + ADMIN_USER }
  ],
  [
    { title: "🏛️ إدارة قنوات الجامعات والمصادر", command: "/universities" },
    { title: "📞 الدعم الفني والمساعدة", command: "/support" }
  ],
  [
    { title: "🎛 العودة للوحة الرئيسية", command: "/start" }
  ]
];

Bot.sendInlineKeyboard(inline_keyboard, text);
