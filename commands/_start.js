/*CMD
  command: /start
  help: لوحة التحكم الرئيسية المنظمة والشاملة لبوت النشر الأكاديمي الذكي V3.2
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard: 🏛️ إدارة الجامعات والمصادر, ➕ معالج ربط جامعة وقناة (5 خطوات)\n🔄 فحص وسحب الأخبار فوراً, 🌐 بحث أخبار جوجل الأكاديمية\n📝 صياغة ونشر خبر فوري, 🎯 إعلان خدماتي البديل\n⚙️ إعدادات الذكاء الاصطناعي, 💬 محادثة وبحث الذكاء\n🔑 مفاتيح API والاعتمادات, 👤 إدارة اليوزربوت وجلسة الحساب\n📝 تعليمات المحرر الأكاديمي, 🧪 تجربة الصياغة الفورية\n📊 حالة النظام والتقارير, 🟢 تشغيل / إيقاف البوت\n📞 الدعم الفني والمساعدة, 🌐 قنواتنا وروابط التواصل
  aliases: 🎛 لوحة التحكم الرئيسية, لوحة التحكم, /help, /menu, /admin, الرئيسية
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
var projects=Bot.getProperty("university_projects",[])||[];var paused=Bot.getProperty("bot_paused",false);var pending=Bot.getProperty("pending_publish_jobs",[])||[];var text="🎓 لوحة النشر الأكاديمي\nالحالة: "+(paused?"متوقف مؤقتًا":"مفعّل")+"\nالمشاريع: "+projects.length+"\nمهام الطابور: "+pending.length+"\n\nكل مصدر مرتبط بوجهة صريحة. تُحفظ الوسائط، ويُمنع التكرار والإعلانات، ولا يظهر المنشور الكامل داخل محادثة البوت.\nالجلب والنشر والذكاء الرد على التعليقات تحتاج اتصالًا بالإنترنت؛ أثناء الانقطاع تبقى المهام محفوظة لإعادة المحاولة.";var kb=[[{title:"🏛️ الجامعات والمصادر",command:"/universities"},{title:"➕ إضافة مشروع",command:"/add_university"}],[{title:"🔄 فحص المصادر",command:"/crawl_sources"},{title:"🗺️ الروابط",command:"/mapping"}],[{title:"📝 نشر يدوي",command:"/new_post"},{title:"💬 مناقشة الذكاء",command:"/chat"}],[{title:"⚙️ إعدادات الذكاء",command:"/ai"},{title:"💬 إعداد التعليقات",command:"/comments"}],[{title:"📊 الحالة",command:"/status"},{title:paused?"▶️ تشغيل":"⏸️ إيقاف",command:"/pause"}],[{title:"📖 المساعدة",command:"/help"}]];Bot.sendInlineKeyboard(kb,text);
