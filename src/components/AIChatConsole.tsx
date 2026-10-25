import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Share2,
  Trash2,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  timestamp: string;
  model?: string;
}

interface AIChatConsoleProps {
  botToken?: string;
  targetChannel?: string;
  onPostSuccess?: (msg: string) => void;
}

export function AIChatConsole({
  targetChannel = '@jhdhhdcj',
  onPostSuccess,
}: AIChatConsoleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً بك يا مديرنا الأكاديمي! 👋\nأنا المساعد الذكي لقناة (' + targetChannel + ') مدعوم بنموذج DeepSeek-V4.1-Flash.\nيمكنك سؤالي عن أي استفسار جامعي (مواعيد القبول، الاختبارات، الشروط)، أو إرسال أي نص خبر لصياغته باحترافية ونشره بضغطة زر واحدة!',
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      model: 'DeepSeek-V4.1-Flash'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('DeepSeek-V4.1-Flash');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openReasoningId, setOpenReasoningId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('ar-SA')
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);
    setStatusMessage(null);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          model: selectedModel,
        })
      });

      const data = await resp.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: data.reply,
          reasoning: data.reasoning,
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          model: data.model || selectedModel
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'فشل في استجابة خادم الذكاء');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ تعذر الحصول على رد من الذكاء الاصطناعي: ${errMsg}\nتأكد من اتصال السيرفر وتوفر الرصيد في البوابة.`,
          timestamp: new Date().toLocaleTimeString('ar-SA')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (msgId: string, content: string) => {
    setPublishingId(msgId);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/university/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_channel: targetChannel,
          text: content
        })
      });
      const data = await resp.json();
      if (data.success) {
        setStatusMessage(`✅ تم النشر بنجاح في القناة ${targetChannel} (معرف الرسالة: ${data.messageId})!`);
        if (onPostSuccess) onPostSuccess(data.messageId);
      } else {
        setStatusMessage(`❌ تعذر النشر في ${targetChannel}: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`❌ فشل الاتصال بخادم النشر: ${msg}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'ما هي شروط القبول والتسجيل العامة بالجامعة؟',
    'صيغ لي إعلاناً رسمياً عن بدء الاختبارات النهائية للطلاب',
    'ما هي خطوات التقديم على المنح والمكافآت الجامعية؟',
    'كيف يتم احتساب المعدل التراكمي ونقاط المواد الجامعية؟'
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
      {/* Console Header */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-950">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">شات الذكاء الاصطناعي الأكاديمي المباشر</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                نشط وفوري
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              محرك استشارات وإعادة صياغة الأخبار ونشرها مباشرة في <span className="text-sky-300 font-mono">{targetChannel}</span>
            </p>
          </div>
        </div>

        {/* Model Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="DeepSeek-V4.1-Flash" className="bg-slate-900 text-white">DeepSeek-V4.1-Flash (دقيق ومنطقي)</option>
              <option value="DeepSeek-V4-Flash" className="bg-slate-900 text-white">DeepSeek-V4-Flash (فائق السرعة)</option>
              <option value="DeepSeek-V4-Pro" className="bg-slate-900 text-white">DeepSeek-V4-Pro (متقدم)</option>
              <option value="auto" className="bg-slate-900 text-white">auto (تلقائي)</option>
            </select>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            title="مسح المحادثة"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Alert if any */}
      {statusMessage && (
        <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between ${
          statusMessage.startsWith('✅') ? 'bg-emerald-950/70 text-emerald-200 border-b border-emerald-800/50' : 'bg-rose-950/70 text-rose-200 border-b border-rose-800/50'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.startsWith('✅') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1 px-1">
                <span>{isUser ? 'أنت (المشرف)' : `المساعد الأكاديمي (${m.model || selectedModel})`}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Collapsible Reasoning if present */}
                {m.reasoning && (
                  <div className="mb-3 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOpenReasoningId(openReasoningId === m.id ? null : m.id)}
                      className="flex items-center justify-between w-full text-amber-300 font-semibold gap-1 hover:text-amber-200"
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>تحليل وتفكير الذكاء الاصطناعي (Chain of Thought)</span>
                      </span>
                      {openReasoningId === m.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {openReasoningId === m.id && (
                      <div className="mt-2 text-slate-400 font-mono text-[10px] max-h-36 overflow-y-auto leading-relaxed border-t border-slate-800 pt-2 text-left" dir="ltr">
                        {m.reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Actual Message Text */}
                <div>{m.content}</div>

                {/* Assistant Action Buttons */}
                {!isUser && m.id !== 'welcome' && !m.content.startsWith('⚠️') && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-800 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ النص</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => handlePublish(m.id, m.content)}
                      disabled={publishingId === m.id}
                      className="px-3 py-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-[11px] font-bold rounded-lg shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {publishingId === m.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري النشر...</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>نشر في {targetChannel}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col items-end">
            <div className="text-[11px] text-slate-400 mb-1 px-1">الذكاء الاصطناعي يفكر ويكتب...</div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-sky-400">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              <span>جاري استدعاء محرك {selectedModel} وصياغة الرد بأعلى دقة...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-400 shrink-0 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          نماذج سريعة:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="shrink-0 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك الأكاديمي، أو الصق نص خبر جامعي لإعادة صياغته ونشره..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>إرسال</span>
          </button>
        </form>
      </div>
    </div>
  );
}
