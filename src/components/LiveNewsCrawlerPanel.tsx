import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Rss,
  Globe,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Send,
  Zap,
} from 'lucide-react';

interface NewsItem {
  source: string;
  type: string;
  title: string;
  text: string;
  link: string;
  date: string;
  imageUrl?: string;
}

interface LiveNewsCrawlerPanelProps {
  targetChannel?: string;
  onSendToChat?: (text: string) => void;
}

export function LiveNewsCrawlerPanel({
  targetChannel = '@jhdhhdcj',
  onSendToChat,
}: LiveNewsCrawlerPanelProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [rephrasedPreviews, setRephrasedPreviews] = useState<{ [key: number]: string }>({});

  const fetchLiveNews = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/news/crawl-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await resp.json();
      if (data.success && Array.isArray(data.news)) {
        setNews(data.news);
        setLastUpdated(new Date().toLocaleTimeString('ar-SA'));
        setStatusMessage(`✅ تم جلب ${data.news.length} خبراً جديداً من تيليجرام وتويتر وجوجل نيوز بنجاح!`);
      } else {
        throw new Error(data.error || 'فشل في سحب المصادر');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`⚠️ تعذر جلب الأخبار: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
    const interval = setInterval(fetchLiveNews, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleRephraseAndPublish = async (item: NewsItem, idx: number) => {
    setProcessingIndex(idx);
    setStatusMessage(null);
    try {
      // 1. Rephrase with fast AI (<1s)
      const aiResp = await fetch('/api/ai/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          model: 'gemini-2.5-flash'
        })
      });
      const aiData = await aiResp.json();
      const rephrased = aiData.rephrasedText || item.text;
      setRephrasedPreviews(prev => ({ ...prev, [idx]: rephrased }));

      // 2. Publish to Telegram
      const pubResp = await fetch('/api/university/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_channel: targetChannel,
          text: rephrased
        })
      });
      const pubData = await pubResp.json();
      if (pubData.success) {
        setStatusMessage(`🎉 تم إعادة الصياغة بالقالب الدائم ونشر الخبر فوراً في ${targetChannel} (معرف الرسالة: ${pubData.messageId})!`);
      } else {
        setStatusMessage(`❌ فشل النشر في تيليجرام: ${pubData.error || 'خطأ'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`❌ حدث خطأ أثناء المعالجة والنشر: ${msg}`);
    } finally {
      setProcessingIndex(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
            <Rss className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">مركز فحص وجلب الأخبار اللحظي (Live News Crawler)</h3>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                جلب تلقائي وسريع نشط ⚡
              </span>
            </div>
            <p className="text-xs text-slate-400">
              يسحب الأخبار فوراً من كافة قنوات تيليجرام وحسابات تويتر (Nitter) وأخبار جوجل دون تجاهل أي حساب مرتبط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              آخر فحص: {lastUpdated}
            </span>
          )}

          <button
            onClick={fetchLiveNews}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'جاري الفحص والسحب...' : 'فحص وجلب الأخبار الآن'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          statusMessage.startsWith('✅') || statusMessage.startsWith('🎉')
            ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-200'
            : 'bg-rose-950/60 border border-rose-800/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.startsWith('✅') || statusMessage.startsWith('🎉') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Crawled Feed List */}
      <div className="space-y-3.5">
        {news.length === 0 && !loading && (
          <div className="p-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-xl space-y-2">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">لم يتم العثور على منشورات مسحوبة حتى الآن.</p>
            <p className="text-[11px] text-slate-500">اضغط على زر «فحص وجلب الأخبار الآن» بالأعلى لبدء السحب الفوري.</p>
          </div>
        )}

        {news.map((item, idx) => {
          const isProcessing = processingIndex === idx;
          const preview = rephrasedPreviews[idx];

          return (
            <div
              key={idx}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    item.type === 'telegram'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : item.type === 'twitter'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.type === 'telegram' ? 'تيليجرام' : item.type === 'twitter' ? 'منصة X / تويتر' : 'أخبار جوجل'}
                  </span>
                  <span className="text-xs font-bold text-white">{item.source}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>{item.date}</span>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <span>المصدر</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Title & Content */}
              <div className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap">
                <div className="font-bold text-sky-300 mb-1">{item.title}</div>
                <div>{item.text}</div>
              </div>

              {/* Rephrased Preview if ready */}
              {preview && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-200 whitespace-pre-wrap space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>الصياغة الأكاديمية الذكية (تم نشرها في {targetChannel}):</span>
                  </div>
                  <div>{preview}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
                <span className="text-[11px] text-slate-500">
                  القناة المستهدفة: <strong className="text-slate-300 font-mono">{targetChannel}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {onSendToChat && (
                    <button
                      onClick={() => onSendToChat(item.text)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>نقل إلى شات الذكاء</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRephraseAndPublish(item, idx)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الصياغة والنشر...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>صياغة ذكية ونشر فوري</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
