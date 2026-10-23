/*CMD
  command: /help
  help: دليل المساعدة وقائمة الأوامر السريعة المنظمة
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases: مساعدة, المساعدة, Help, help, /commands
CMD*/

var adminIds=Bot.getProperty("admin_ids",[7607633343])||[7607633343],isAdmin=false;if(user){for(var a=0;a<adminIds.length;a++)if(String(adminIds[a])===String(user.telegramid))isAdmin=true;}if(!isAdmin){Bot.sendMessage("هذا الأمر مخصص للمشرف المعتمد فقط.");return;}
Bot.sendMessage("الأوامر الأساسية:\n/universities إدارة المشاريع\n/add_university إضافة ربط\n/mapping عرض الروابط الفعلية\n/crawl_sources فحص فوري\n/new_post نشر يدوي\n/chat مناقشة مفتوحة؛ اكتب تعلم: ثم القاعدة لحفظها\n/comments إعداد مجموعة المناقشة المرتبطة\n/status حالة الطابور\n/pause إيقاف أو استئناف\n\nلا يطلب البوت OTP أو 2FA أو StringSession. لا يعمل الجلب أو النشر أو الذكاء دون إنترنت.");
