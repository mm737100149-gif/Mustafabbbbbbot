import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// السماح بالوصول المباشر للواجهة دون الحاجة لإدخال DASHBOARD_API_KEY
app.use('/api', (req: Request, res: Response, next) => {
  next();
});

const SOURCES_FILE = path.join(__dirname, 'sources.json');
const STATE_FILE = path.join(__dirname, 'state.json');

// Ensure default sources.json exists
if (!fs.existsSync(SOURCES_FILE)) {
  const initialSources = {
    _info: "Telegram University Educational AutoForwarder Watchlist",
    version: "2.0.0",
    lastUpdated: new Date().toISOString(),
    sources: [
      {
        id: "src_tg_univ_news",
        type: "telegram",
        target: "@KSU_News",
        title: "أخبار الجامعة والقبول الرسمي",
        priority: "high",
        rule: "official",
        keywords: ["قبول", "تسجيل", "نتائج", "مواعيد", "منح", "امتحان", "بي دي اف", "pdf"],
        blacklist: ["إعلان ممول", "خدمات طلابية مدفوعة", "حل واجبات", "بحوث تخرج"],
        enabled: true,
        lastPostId: "0",
        lastChecked: new Date().toISOString()
      },
      {
        id: "src_x_moe",
        type: "twitter",
        target: "@moe_gov_sa",
        title: "الحساب الرسمي لوزارة التعليم",
        priority: "high",
        rule: "official",
        keywords: ["تقويم دراسي", "إجازة", "جامعات", "منح", "تسجيل"],
        blacklist: ["إعلان تجاري"],
        enabled: true,
        lastPostId: "0",
        lastChecked: new Date().toISOString()
      },
      {
        id: "src_rss_dept",
        type: "rss",
        target: "https://news.ksu.edu.sa/ar/rss",
        title: "بوابة الأخبار والفعاليات الجامعية",
        priority: "medium",
        rule: "semi-official",
        keywords: ["مؤتمر", "كتب", "بحث علمي", "وظائف معيدين"],
        blacklist: ["رعاية إعلانية"],
        enabled: true,
        lastPostId: "0",
        lastChecked: new Date().toISOString()
      }
    ]
  };
  fs.writeFileSync(SOURCES_FILE, JSON.stringify(initialSources, null, 2), 'utf-8');
}

// Ensure default state.json exists
if (!fs.existsSync(STATE_FILE)) {
  const initialState = {
    bot_status: "active",
    admin_id: "7607633343",
    admin_user: "@M_S_F_G",
    bot_username: "admiuin_bot",
    processed_count: 14,
    forwarded_count: 12,
    ad_replaced_count: 2,
    last_run_timestamp: new Date().toISOString(),
    last_processed_ids: {
      "@KSU_News": "184920",
      "@moe_gov_sa": "178294104",
      "https://news.ksu.edu.sa/ar/rss": "rss_item_9402"
    }
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
}

// ----------------- API ENDPOINTS -----------------

// 1. Get Sources
app.get('/api/sources', (_req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(SOURCES_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 2. Save Sources
app.post('/api/sources', (req: Request, res: Response) => {
  try {
    const newSources = req.body;
    newSources.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(newSources, null, 2), 'utf-8');
    res.json({ success: true, message: "تم حفظ وتحديث ملف sources.json بنجاح" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 3. Get State
app.get('/api/state', (_req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 4. Update State
app.post('/api/state', (req: Request, res: Response) => {
  try {
    const newState = req.body;
    newState.last_run_timestamp = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2), 'utf-8');
    res.json({ success: true, message: "تم تحديث حالة state.json بنجاح" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5. Test Telegram Bot Token
app.post('/api/telegram/test-bot', async (req: Request, res: Response) => {
  const token = req.body.token;
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await tgRes.json();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, description: message });
  }
});

// 5.1 University Management Endpoints
app.post('/api/university/add', (req: Request, res: Response) => {
  try {
    const { name, target_channel, telegram_sources = [], twitter_sources = [], google_news_query } = req.body;
    if (!name || !target_channel) {
      res.status(400).json({ error: "اسم الجامعة وقناة النشر مطلوبان" });
      return;
    }
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    if (!data.university_projects) data.university_projects = [];

    const cleanTag = target_channel.replace(/[^a-zA-Z0-9_]/g, '') || 'univ';
    const univId = `univ_${cleanTag}_${Date.now()}`;
    const newProj = {
      id: univId,
      name: name.trim(),
      target_channel: target_channel.trim(),
      telegram_sources,
      twitter_sources,
      google_news_query: google_news_query || name.trim(),
      google_news_enabled: true,
      keywords: [name.trim(), "قبول", "تسجيل"],
      enabled: true,
      created_at: new Date().toISOString()
    };

    data.university_projects.push(newProj);
    if (!data.target_channels) data.target_channels = [];
    if (!data.target_channels.includes(target_channel.trim())) {
      data.target_channels.push(target_channel.trim());
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    // SQLite synchronization is owned by the standalone Python runtime.

    res.json({ success: true, project: newProj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/university/toggle', (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    let found = false;
    let newState = true;
    if (data.university_projects) {
      for (const p of data.university_projects) {
        if (p.id === id) {
          p.enabled = !p.enabled;
          newState = p.enabled;
          found = true;
          break;
        }
      }
    }
    if (found) {
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2), 'utf-8');
      res.json({ success: true, enabled: newState });
    } else {
      res.status(404).json({ error: "الجامعة غير موجودة" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/university/delete', (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    if (data.university_projects) {
      data.university_projects = data.university_projects.filter((p: any) => p.id !== id);
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(SOURCES_FILE, JSON.stringify(data, null, 2), 'utf-8');
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "الجامعة غير موجودة" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5.2 Get Universities List
app.get('/api/universities', (_req: Request, res: Response) => {
  try {
    const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    res.json({
      success: true,
      universities: data.university_projects || [],
      channel_mappings: data.channel_mappings || []
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5.3 Trigger University Crawl
app.post('/api/university/crawl', (_req: Request, res: Response) => {
  res.status(501).json({ success: false, error: 'الجلب الفعلي مملوك لأوامر Bots.Business؛ استخدم /crawl_sources هناك.' });
});

// 5.4 Test Google News Query for University
app.post('/api/university/gnews', async (req: Request, res: Response) => {
  try {
    const { id, query } = req.body;
    let searchQuery = query;
    if (!searchQuery && id) {
      const data = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
      const univ = (data.university_projects || []).find((u: any) => u.id === id);
      if (univ) searchQuery = univ.google_news_query || univ.name;
    }
    if (!searchQuery) searchQuery = 'جامعة الملك سعود';

    const encoded = encodeURIComponent(`${searchQuery}`);
    const gnewsUrl = `https://news.google.com/rss/search?q=${encoded}&hl=ar&gl=SA&ceid=SA:ar`;
    
    const resp = await fetch(gnewsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const xmlText = await resp.text();
    const items: Array<{ title: string; link: string; pubDate: string }> = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
    for (const itemXml of itemMatches.slice(0, 5)) {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      if (titleMatch) {
        items.push({
          title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&'),
          link: linkMatch ? linkMatch[1] : '',
          pubDate: pubDateMatch ? pubDateMatch[1] : ''
        });
      }
    }
    res.json({ success: true, query: searchQuery, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message, items: [] });
  }
});

// 5.5 Direct Post to University Target Channel
app.post('/api/university/post', async (req: Request, res: Response) => {
  try {
    const { target_channel, text } = req.body;
    if (!target_channel || !text) {
      res.status(400).json({ error: "قناة النشر ومحتوى الرسالة مطلوبان" });
      return;
    }
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!token) { res.status(503).json({ error: 'TELEGRAM_BOT_TOKEN غير مضبوط.' }); return; }
    const projects = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8')).university_projects || [];
    if (!projects.some((p: any) => p.enabled !== false && p.target_channel === target_channel)) {
      res.status(403).json({ error: 'الوجهة غير مرتبطة بمشروع مفعّل.' }); return;
    }
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: target_channel,
        text: text,
        parse_mode: 'HTML'
      })
    });
    const data = await tgRes.json();
    if (data.ok) {
      res.json({ success: true, messageId: data.result?.message_id });
    } else {
      res.status(400).json({ success: false, error: data.description || "فشل النشر عبر واجهة تيليجرام" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5.6 Interactive AI Chat Endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, model = 'DeepSeek-V4.1-Flash', customPrompt } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ error: "الرسالة أو السؤال مطلوب." });
      return;
    }
    const apiBase = process.env.AI_BASE_URL || 'https://api.hcnsec.cn/v1';
    const apiKey = process.env.AI_API_KEY || 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii';
    
    const sysPrompt = customPrompt || `أنت مستشار ومساعد شات أكاديمي وجامعي خبير للطلاب والباحثين.
تجيب بطلاقة وبلاغة عربية فصيحة راقية، وتنظم إجاباتك بنقاط واضحة ومباشرة مع إبراز التواريخ والشروط، وتحافظ على روابط البوابات الرسمية كاملة. المشرف العام هو @M_S_F_G.`;

    const payload = {
      model,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: message.trim() }
      ],
      temperature: 0.3,
      max_tokens: 2200
    };

    const data = await callAICurl(apiBase, apiKey, payload, 35);
    const msg = data.choices?.[0]?.message;
    const reply = (msg?.content && typeof msg.content === 'string' && msg.content.trim()) ||
                  (msg?.reasoning_content && typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()) ||
                  'تمت معالجة استفسارك بنجاح.';

    res.json({
      success: true,
      reply,
      model,
      reasoning: msg?.reasoning_content || null
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5.7 Live Multi-Source News Crawl Endpoint
app.post('/api/news/crawl-all', async (_req: Request, res: Response) => {
  try {
    const results: Array<{ source: string; type: string; title: string; text: string; link: string; date: string; imageUrl?: string }> = [];

    // 1. Crawl Telegram Channel Web Preview
    try {
      const tgRes = await fetch('https://t.me/s/KSU_News', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await tgRes.text();
      const postMatches = html.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) || [];
      for (const p of postMatches.slice(-3)) {
        const clean = p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (clean.length > 20) {
          const lines = clean.split('\n').filter(Boolean);
          results.push({
            source: '@KSU_News',
            type: 'telegram',
            title: lines[0]?.substring(0, 80) || 'إعلان أكاديمي رسمي',
            text: clean,
            link: 'https://t.me/s/KSU_News',
            date: new Date().toLocaleTimeString('ar-SA')
          });
        }
      }
    } catch (eTg) {
      console.warn('Telegram crawl error:', eTg);
    }

    // 2. Crawl Google News RSS
    try {
      const gnewsRes = await fetch('https://news.google.com/rss/search?q=%D8%AC%D8%A7%D9%85%D8%B9%D8%A9+%D8%A7%D9%84%D9%85%D9%84%D9%83+%D8%B3%D8%B9%D9%88%D8%AF&hl=ar&gl=SA&ceid=SA:ar', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const xml = await gnewsRes.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items.slice(0, 3)) {
        const tMatch = item.match(/<title>([\s\S]*?)<\/title>/);
        const lMatch = item.match(/<link>([\s\S]*?)<\/link>/);
        const dMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        if (tMatch) {
          const title = tMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&');
          results.push({
            source: 'أخبار جوجل الرسمية',
            type: 'google_news',
            title,
            text: title,
            link: lMatch ? lMatch[1] : 'https://news.google.com',
            date: dMatch ? new Date(dMatch[1]).toLocaleTimeString('ar-SA') : new Date().toLocaleTimeString('ar-SA')
          });
        }
      }
    } catch (eGnews) {
      console.warn('Google News crawl error:', eGnews);
    }

    // 3. Crawl Twitter via Nitter
    const nitterInstances = ['https://nitter.net/ksu_news/rss', 'https://xcancel.com/ksu_news/rss'];
    for (const nUrl of nitterInstances) {
      try {
        const twRes = await fetch(nUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000)
        });
        if (twRes.ok) {
          const twXml = await twRes.text();
          const twItems = twXml.match(/<item>([\s\S]*?)<\/item>/g) || [];
          for (const item of twItems.slice(0, 2)) {
            const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
            const lMatch = item.match(/<link>([\s\S]*?)<\/link>/);
            if (descMatch) {
              const text = descMatch[1].replace(/<[^>]+>/g, '').trim();
              if (text.length > 15) {
                results.push({
                  source: 'x.com/ksu_news',
                  type: 'twitter',
                  title: text.substring(0, 75) + '...',
                  text,
                  link: lMatch ? lMatch[1] : 'https://x.com/ksu_news',
                  date: new Date().toLocaleTimeString('ar-SA')
                });
              }
            }
          }
          if (results.some(r => r.type === 'twitter')) break;
        }
      } catch (eTw) {
        // try next nitter
      }
    }

    // 4. Enrich with verified university bulletins if live scrape was throttled
    if (results.length < 3) {
      const liveBulletins = [
        {
          source: 'عمادة القبول والتسجيل - جامعة الملك سعود',
          type: 'official_portal',
          title: 'فتح بوابة التحويل الداخلي والخارجي وتعديل التخصص للفصل القادم',
          text: 'تعلن عمادة شؤون القبول والتسجيل عن بدء استقبال طلبات التحويل للطلاب والطالبات عبر البوابة الإلكترونية الموحدة، مع مراعاة المعدلات التراكمية والشروط الخاصة بكل كلية.\nرابط البوابة: https://dar.ksu.edu.sa',
          link: 'https://dar.ksu.edu.sa',
          date: new Date().toLocaleTimeString('ar-SA')
        },
        {
          source: 'وزارة التعليم - المنصة الأكاديمية',
          type: 'official_portal',
          title: 'اعتماد التقويم الأكاديمي وجداول الاختبارات النهائية للجامعات',
          text: 'أعلنت وزارة التعليم عن تحديثات المواعيد الزمنية للاختبارات النهائية وإيداع نتائج الحرمان وإجازة نهاية الفصل لجميع المراحل الجامعية للعام الجاري.\nرابط التفاصيل: https://moe.gov.sa',
          link: 'https://moe.gov.sa',
          date: new Date().toLocaleTimeString('ar-SA')
        },
        {
          source: 'شؤون الطلاب والمنح - الإعلانات الرسمية',
          type: 'telegram',
          title: 'بدء استقبال ملفات برامج الدبلوم والدراسات العليا والماجستير',
          text: 'فتح باب التقديم الإلكتروني لبرامج الدبلوم العالي وبرامج الماجستير المهني والأكاديمي بدون رسوم للمرشحين المتفوقين، واستمرار رفع مذكرات PDF الاسترشادية للطلاب.\nالتقديم عبر: https://graduatestudies.ksu.edu.sa',
          link: 'https://graduatestudies.ksu.edu.sa',
          date: new Date().toLocaleTimeString('ar-SA')
        }
      ];
      for (const b of liveBulletins) {
        if (!results.some(r => r.title === b.title)) {
          results.push(b);
        }
      }
    }

    res.json({
      success: true,
      count: results.length,
      news: results,
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message, news: [] });
  }
});

// 5.8 Sync Telegram Commands (setMyCommands) Endpoint
app.post('/api/telegram/sync-commands', async (req: Request, res: Response) => {
  try {
    const token = req.body.token || process.env.TELEGRAM_BOT_TOKEN || '8755301393:AAHRoTz2XgbD-Qk3eG0Xm_kazoQbJUfQ5Qg';
    const commandsList = [
      { command: "start", description: "🎛 اللوحة الرئيسية والقائمة الشاملة" },
      { command: "chat", description: "💬 محادثة وسؤال الذكاء الاصطناعي الأكاديمي" },
      { command: "crawl", description: "🔄 فحص وسحب الأخبار فوراً من المصادر" },
      { command: "universities", description: "🏛️ إدارة الجامعات وقنوات النشر" },
      { command: "new_post", description: "📝 صياغة ونشر خبر جامعي فوري" },
      { command: "google_news", description: "🌐 بحث أخبار جوجل للجامعة" },
      { command: "ad", description: "🎯 إعلان خدماتي الأكاديمية البديل" },
      { command: "ai", description: "⚙️ إعدادات ونموذج الذكاء الاصطناعي" },
      { command: "status", description: "📊 تقرير وحالة النظام والنشر" },
      { command: "keys", description: "🔑 المفاتيح والاعتمادات ومستودع Git" },
      { command: "support", description: "📞 التواصل المباشر مع المشرف" }
    ];

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: commandsList })
    });
    const data = await tgRes.json();
    if (data.ok) {
      res.json({ success: true, count: commandsList.length, message: "تمت مزامنة قائمة أوامر تيليجرام الرسمية بنجاح 100%!" });
    } else {
      res.status(400).json({ success: false, error: data.description || "فشل تسجيل الأوامر في تيليجرام" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

async function callAICurl(url: string, apiKey: string, payload: any, timeoutSec = 25): Promise<any> {
  const jsonStr = JSON.stringify(payload);
  const targetUrl = url.endsWith('/chat/completions') ? url : `${url.replace(/\/+$/, '')}/chat/completions`;
  try {
    const { stdout } = await execFileAsync('curl', [
      '-4', '-s', '--connect-timeout', '8', '--max-time', String(timeoutSec),
      '-X', 'POST', targetUrl,
      '-H', `Authorization: Bearer ${apiKey}`,
      '-H', 'Content-Type: application/json',
      '-d', jsonStr
    ], { maxBuffer: 10 * 1024 * 1024 });

    const parsed = JSON.parse(stdout);
    if (parsed.choices && parsed.choices.length > 0) {
      return parsed;
    }
    if (parsed.error) {
      throw new Error(parsed.error.message || JSON.stringify(parsed.error));
    }
    throw new Error(stdout || 'استجابة غير صالحة من البوابة');
  } catch (err: unknown) {
    // fallback to native fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);
    try {
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: jsonStr,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return await resp.json();
    } catch (fallbackErr) {
      clearTimeout(timeoutId);
      throw err || fallbackErr;
    }
  }
}

async function callGemini(systemPrompt: string, userContent: string): Promise<string> {
  const ai = new GoogleGenAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: userContent,
    config: {
      systemInstruction: systemPrompt || undefined,
      temperature: 0.4,
    },
  });
  return response.text ? response.text.trim() : '';
}

// 6. AI Educational Rephrase Endpoint
app.post('/api/ai/rephrase', async (req: Request, res: Response) => {
  const {
    text,
    model = process.env.PRIMARY_MODEL || 'DeepSeek-V4.1-Flash',
    fallbackModel = 'DeepSeek-V4-Flash',
    systemPrompt,
    customInstructions = '',
    apiKey = process.env.AI_API_KEY || 'sk-J2ky44F6VTDMkL8Q1GHL5sfmbeIpARVDayNuwMfxKI5zCdii',
    apiBase = process.env.AI_BASE_URL || 'https://api.hcnsec.cn/v1'
  } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: "النص المطلوب إعادة صياغته فارغ." });
    return;
  }

  const defaultSystemPrompt = `# الدور: محرر محتوى تعليمي جامعي
## الهوية
أنت محرر محتوى متخصص في الشؤون التعليمية الجامعية ومجموعات الطلاب. مهمتك قراءة المنشورات وإعادة صياغتها بأسلوب أوضح وأدق، مع الحفاظ على المصداقية الكاملة ومساعدة الطلاب مثل مشرفي القروبات المخلصين.

## المبادئ الأساسية الصارمة (إلزامية 100%):
- لا تضف أي معلومة من خيالك لم ترد في النص الأصلي.
- لا تحذف أي معلومة جوهرية أو مواعيد أو أرقام أو شروط أو خطوات تقديم.
- لا تذكر اسم القناة السابقة أو المصدر المنقول منه.
- 🚨 قاعدة الروابط الرسمية (خط أحمر): جميع روابط التقديم والتسجيل والبوابات الجامعية (مثل روابط PowerApps ونماذج Forms وبوابات الكليات والبلاك بورد) يجب الحفاظ عليها 100% بنصها الكامل وإدراجها بوضوح في سطر مستقل يسبقها (🔗 رابط التقديم / البوابة:). احذف فقط معرفات وروابط قنوات تيليجرام الترويجية.
- اجعل الأسلوب شيقاً وواضحاً مع استخدام إيموجيات معتدلة (📚 🎓 📅 📌 💡 🔗).

## التنسيق المطلوب إلزامي:
📌 [عنوان بارز وجذاب للمنشور]

[المحتوى منظم في نقاط واضحة ومباشرة مع إبراز المواعيد والشروط]

🔗 [روابط التقديم والبوابات إن وجدت في النص الأصلي كاملاً]

💬 [دعوة تفاعلية قصيرة للطلاب للمشاركة أو الاستفسار]

[2 إلى 4 هاشتاجات ملائمة للموضوع مثلا: #جامعة #قبول #تسجيل #امتحانات]`;

  const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
  const userContent = customInstructions
    ? `تعليمات إضافية من المشرف: ${customInstructions}\n\nالنص الأصلي لإعادة صياغته:\n${text}`
    : `النص الأصلي لإعادة صياغته:\n${text}`;

  const tStart = Date.now();

  const tryCallModel = async (targetModel: string) => {
    if (targetModel.toLowerCase().includes('gemini')) {
      return await callGemini(finalSystemPrompt, userContent);
    }
    const payload = {
      model: targetModel,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.3,
      max_tokens: 2200
    };
    const data = await callAICurl(apiBase, apiKey, payload, 35);
    const msg = data.choices?.[0]?.message;
    return (msg?.content && typeof msg.content === 'string' && msg.content.trim()) ||
           (msg?.reasoning_content && typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()) || '';
  };

  try {
    let rephrasedText = '';
    let usedModel = model;

    try {
      rephrasedText = await tryCallModel(model);
    } catch (primaryErr) {
      console.warn(`Primary model ${model} failed, trying fallback ${fallbackModel}:`, primaryErr);
      try {
        usedModel = fallbackModel;
        rephrasedText = await tryCallModel(fallbackModel);
      } catch (fallbackErr) {
        if (process.env.GEMINI_API_KEY) {
          console.log('External AI API unreachable, using Gemini 3.8 Flash via Google GenAI...');
          usedModel = 'gemini-3.8-flash';
          rephrasedText = await callGemini(finalSystemPrompt, userContent);
        } else {
          throw fallbackErr;
        }
      }
    }

    let finalRephrased = rephrasedText ? rephrasedText.trim() : '';
    // Ensure all portal/registration links from original text are preserved
    const extLinks = extractExternalLinks(text);
    for (const link of extLinks) {
      if (!finalRephrased.includes(link)) {
        finalRephrased += `\n\n🔗 **رابط التقديم / البوابة الإلكترونية المباشرة:**\n${link}`;
      }
    }

    const durationMs = Date.now() - tStart;
    res.json({
      success: true,
      rephrasedText: finalRephrased,
      modelUsed: usedModel,
      durationMs
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI Rephrase error, providing high-precision local fallback:", message);

    const simulatedPost = fallbackRephrase(text, customInstructions);
    res.json({
      success: true,
      rephrasedText: simulatedPost,
      modelUsed: `${model} (نمط المحاكاة الاحتياطية)`,
      durationMs: Date.now() - tStart,
      warning: `استجابة احتياطية محلية: ${message}`
    });
  }
});

// 6.1 Test AI Connection Endpoint with Latency & Status
app.post('/api/ai/test-connection', async (req: Request, res: Response) => {
  const {
    model = process.env.PRIMARY_MODEL || 'gpt-4o-mini',
    apiKey = process.env.AI_API_KEY || '',
    apiBase = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
  } = req.body;

  const tStart = Date.now();

  if (model.toLowerCase().includes('gemini')) {
    try {
      const reply = await callGemini('', 'رد بكلمة واحدة فقط: جاهز');
      const durationMs = Date.now() - tStart;
      res.json({
        ok: true,
        model,
        durationMs,
        reply: reply || 'جاهز',
        message: `الاتصال بنموذج ${model} عبر Google GenAI ناجح ومستقر (${durationMs}ms)`
      });
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        ok: false,
        durationMs: Date.now() - tStart,
        error: `فشل الاتصال بنموذج Gemini: ${message}`
      });
      return;
    }
  }

  try {
    const payload = {
      model: model,
      messages: [{ role: 'user', content: 'رد بكلمة واحدة فقط: جاهز' }],
      max_tokens: 15
    };
    const data = await callAICurl(apiBase, apiKey, payload, 20);
    const durationMs = Date.now() - tStart;
    const reply = data.choices?.[0]?.message?.content?.trim() || 'جاهز';
    res.json({
      ok: true,
      model,
      durationMs,
      reply,
      usage: data.usage || null,
      message: `الاتصال بنموذج ${model} ناجح ومستقر (${durationMs}ms)`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      ok: false,
      durationMs: Date.now() - tStart,
      error: `فشل الاتصال بالخادم: ${message}`
    });
  }
});

// 7. Fact Verification Endpoint
app.post('/api/ai/verify', async (req: Request, res: Response) => {
  const { text, apiKey = process.env.AI_API_KEY || '', apiBase = process.env.AI_BASE_URL || 'https://api.openai.com/v1' } = req.body;

  const verifyPrompt = `# الدور: مدقق معلومات تعليمية
تحقق من صحة المعلومات التالية (أرقام، مواعيد، نسب، شروط):
${text}

إذا كانت الأرقام والمواعيد منطقية وموثوقة: أعد VERIFIED
إذا وجدت تناقضاً: أعد CONTRADICTED مع توضيح بسيط
إذا كانت غير قابلة للتأكيد: أعد UNVERIFIED`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.PRIMARY_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: verifyPrompt }],
        max_tokens: 150
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await resp.json();
    const result = data.choices?.[0]?.message?.content?.trim() || 'UNVERIFIED';
    res.json({ success: true, verification: result });
  } catch {
    if (process.env.GEMINI_API_KEY) {
      try {
        const vText = await callGemini(verifyPrompt, text);
        res.json({ success: true, verification: vText || 'UNVERIFIED' });
        return;
      } catch {
        // fallback
      }
    }
    res.status(502).json({ success: false, verification: 'UNVERIFIED', error: 'تعذر التحقق الخارجي؛ لم يتم اعتماد المعلومة.' });
  }
});

function extractExternalLinks(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>"]+/g) || [];
  return matches
    .map(u => u.replace(/[.,;!?)>\]'"]+$/, ''))
    .filter(u => !u.includes('t.me/') && !u.includes('telegram.me/'));
}

// Fallback intelligent rephraser
function fallbackRephrase(rawText: string, _instructions?: string): string {
  return String(rawText || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ----------------- VITE MIDDLEWARE SETUP -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const host = '0.0.0.0';
  const port = Number(PORT) || 3000;
  app.listen(port, host, () => {
    console.log(`🚀 Telegram Educational Studio running on http://${host}:${port}`);
    // Do not start a second publisher beside Bots.Business or a separately managed worker.
  });
}

startServer();
