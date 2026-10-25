#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# 🚀 سكريبت التشغيل الشامل والفوري في Termux (Android)
# نظام النشر الأكاديمي والجامعي الذكي V4.5 مع لوحة التحكم
# المشرف العام: @M_S_F_G (ID: 7607633343)
# ==============================================================================

clear
echo "=================================================================="
echo "🎓 مرحباً بك في مشغل البوت الأكاديمي الشامل في Termux"
echo "👑 المشرف العام: @M_S_F_G | القناة المستهدفة: @jhdhhdcj"
echo "=================================================================="
echo ""

# 1. التحقق من وجود الحزم الأساسية وتثبيتها تلقائياً
echo "🔍 [1/4] التحقق من حزم بايثون ونود في Termux..."
pkg update -y > /dev/null 2>&1
pkg install -y python git nodejs > /dev/null 2>&1

# 2. إنشاء ملف الإعدادات .env تلقائياً إن لم يكن موجوداً
echo "⚙️ [2/4] تثبيت مفاتيح الاعتماد والذكاء الاصطناعي..."
cat << 'EOF' > .env
BOT_TOKEN=8812285802:AAGJ7zXy_JUVmBY2QddqbT_NSrmTe_XZY5U
ADMIN_ID=7607633343
ADMIN_USERNAME=M_S_F_G
AI_BASE_URL=https://api.hcnsec.cn/v1
AI_API_KEY=sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii
PRIMARY_MODEL=DeepSeek-V4.1-Flash
FALLBACK_MODEL=DeepSeek-V4.1-Flash
TARGET_CHANNEL=@jhdhhdcj
PORT=3000
EOF

# 3. تثبيت مكتبات بايثون المطلوبة
echo "📦 [3/4] تثبيت مكتبات بايثون (Telethon, Requests, Feedparser)..."
pip install -r requirements.txt > /dev/null 2>&1

echo "✅ [4/4] النظام جاهز للعمل 100%!"
echo ""
echo "=================================================================="
echo "اختر طريقة التشغيل المطلوبة:"
echo "1) 🤖 تشغيل البوت الآلي 24/7 (سحب قنوات، تويتر Nitter، وجوجل نيوز)"
echo "2) 🌐 تشغيل لوحة التحكم الكاملة (Web Dashboard) على المتصفح"
echo "3) 🚀 تشغيل البوت + لوحة التحكم معاً في الخلفية"
echo "4) 🔑 استخراج كود الجلسة (StringSession) لليوزربوت"
echo "5) 🧪 اختبار إرسال منشور تجريبي فوري"
echo "=================================================================="
read -p "👉 أدخل رقم خيارك [1-5]: " choice

case $choice in
  1)
    echo ""
    echo "⚡ جاري تشغيل البوت الأكاديمي..."
    python3 main.py
    ;;
  2)
    echo ""
    echo "🌐 جاري تشغيل لوحة التحكم على المنفذ 3000..."
    echo "🔗 بعد التشغيل افتح المتصفح على: http://localhost:3000"
    npm run dev
    ;;
  3)
    echo ""
    echo "🚀 جاري تشغيل البوت في الخلفية ولوحة التحكم معاً..."
    nohup python3 main.py > bot.log 2>&1 &
    echo "✅ تم تشغيل محرك البوت في الخلفية (PID: $!)."
    echo "🔗 جاري فتح لوحة التحكم على: http://localhost:3000"
    npm run dev
    ;;
  4)
    echo ""
    echo "🔑 تشغيل معالج استخراج كود الجلسة..."
    python3 generate_session.py
    ;;
  5)
    echo ""
    echo "🧪 اختبار إرسال رسالة تجريبية إلى المشرف والقناة..."
    python3 -c "
import requests, os
token = '8812285802:AAGJ7zXy_JUVmBY2QddqbT_NSrmTe_XZY5U'
admin_id = '7607633343'
r = requests.post(f'https://api.telegram.org/bot{token}/sendMessage', data={'chat_id': admin_id, 'text': '✅ اختبار تشغيل البوت من Termux بنجاح تام!'})
print('استجابة المشرف:', r.json().get('ok'))
"
    ;;
  *)
    echo "تشغيل البوت افتراضياً..."
    python3 main.py
    ;;
esac
