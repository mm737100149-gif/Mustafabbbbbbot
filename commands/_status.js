/*CMD
  command: /status
  help: عرض تقارير النشر وإحصائيات العمليات الشاملة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: 📊 حالة النظام والتقارير, حالة النظام, 📊 تقارير النشر, 📊 حالة البوت, /stats, /report, تقارير النشر
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
var projects=Bot.getProperty("university_projects",[])||[],queue=Bot.getProperty("pending_publish_jobs",[])||[];var text="📊 الحالة الفعلية\nالنشر: "+(Bot.getProperty("bot_paused",false)?"متوقف مؤقتًا":"مفعّل")+"\nالمشاريع: "+projects.length+"\nمنشورات مؤكدة: "+Bot.getProperty("total_published",0)+"\nإعلانات محجوبة: "+Bot.getProperty("total_ads_blocked",0)+"\nمهام باقية أو قيد المحاولة: "+queue.length+"\nالذكاء: "+(Bot.getProperty("ai_api_key","")?"مضبوط":"غير مضبوط؛ سيُستخدم التنظيف المحلي")+"\nالتشغيل الدوري: كل 5 دقائق عند استيراد bot.json وتفعيل Auto Retry.";Bot.sendMessage(text);
