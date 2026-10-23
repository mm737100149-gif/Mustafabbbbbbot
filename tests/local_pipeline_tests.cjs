/* اختبارات محلية فقط: لا اتصال بالشبكة ولا مفاتيح ولا نشر حقيقي. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('✓ ' + name); }
  catch (error) { console.error('✗ ' + name + '\n' + error.stack); process.exitCode = 1; }
}
function body(command) {
  const text = fs.readFileSync(path.join(root, 'commands', command + '.js'), 'utf8');
  return text.split('CMD*/')[1];
}
function harness(initial = {}) {
  const state = Object.assign({}, initial);
  const calls = [];
  const sent = [];
  const scheduled = [];
  const messages = [];
  const userStores = new Map();
  const Bot = {
    getProperty(key, fallback) { return Object.prototype.hasOwnProperty.call(state, key) && state[key] !== null ? state[key] : fallback; },
    setProperty(key, value) { state[key] = value; },
    runCommand(command, options) { calls.push({ command, options }); },
    run(options) { scheduled.push(options); },
    sendMessage(text) { messages.push(text); },
    sendInlineKeyboard(_keyboard, text) { messages.push(text); }
  };
  const apiHandler = method => request => sent.push({ method, request });
  const env = {
    Bot,
    Api: {
      sendMessage: apiHandler('sendMessage'), sendPhoto: apiHandler('sendPhoto'),
      sendVideo: apiHandler('sendVideo'), sendDocument: apiHandler('sendDocument'),
      sendAudio: apiHandler('sendAudio'), sendVoice: apiHandler('sendVoice')
    },
    HTTP: { get: request => calls.push({ httpGet: request }), post: request => calls.push({ httpPost: request }) },
    user: { telegramid: 7607633343 },
    message: '', request: null, params: '', options: null, content: '', console
  };
  function run(command, extra = {}) {
    const local = Object.assign({}, env, extra);
    const activeUser = extra.user || env.user;
    if (activeUser) {
      const id = String(activeUser.telegramid);
      if (!userStores.has(id)) userStores.set(id, {});
      const store = userStores.get(id);
      local.User = {
        getProperty(key, fallback) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback; },
        setProperty(key, value) { store[key] = value; }
      };
    } else {
      local.User = { getProperty: (_k, f) => f, setProperty: () => {} };
    }
    const names = Object.keys(local);
    const fn = new Function(...names, body(command));
    fn(...names.map(name => local[name]));
    return local;
  }
  return { state, calls, sent, scheduled, messages, userStores, run };
}
const projects = [{
  id: 'u1', name: 'جامعة الاختبار', target_channel: '@target1', enabled: true,
  telegram_sources: ['@mapped'], twitter_sources: ['@mappedx'],
  google_news_enabled: true, google_news_aliases: ['اختبار']
}];

test('قبول منشور قصير من مصدر موثوق دون ذكر اسم الجامعة', () => {
  const h = harness({ university_projects: projects });
  h.run('_submit_post', { options: { university_id: 'u1', source_type: 'telegram', source_id: '@mapped', source_post_id: '10', raw_text: 'آخر موعد غدًا.', media: [] } });
  assert.equal(h.calls[0].command, '/process_publish_job');
  const job = h.state['publish_job_' + h.calls[0].options.job_id];
  assert.equal(job.raw_text, 'آخر موعد غدًا.');
});

test('قبول الوسائط دون نص ومنع أول جامعة كوجهة احتياطية', () => {
  const h = harness({ university_projects: projects });
  h.run('_submit_post', { options: { university_id: 'u1', source_id: '@mapped', source_post_id: '11', raw_text: '', media: [{ type: 'document', id: 'doc' }] } });
  assert.equal(h.calls.length, 1);
  h.run('_submit_post', { options: { university_id: 'missing', source_id: '@unknown', source_post_id: '12', raw_text: 'خبر' } });
  assert.equal(h.calls.length, 1);
});

test('حجب الإعلان مرة واحدة ومنع تكرار المنشور بالهوية الثابتة', () => {
  const h = harness({ university_projects: projects });
  const ad = { university_id: 'u1', source_id: '@mapped', source_post_id: '20', raw_text: 'حل واجبات وكتابة أبحاث، تواصل واتساب' };
  h.run('_submit_post', { options: ad });
  h.run('_submit_post', { options: ad });
  assert.equal(h.state.total_ads_blocked, 1);
  const post = { university_id: 'u1', source_id: '@mapped', source_post_id: '21', raw_text: 'موعد مهم' };
  h.run('_submit_post', { options: post });
  h.run('_submit_post', { options: post });
  assert.equal(h.calls.filter(c => c.command === '/process_publish_job').length, 1);
});

test('التنظيف المحلي يحافظ على النص ويقرأ اسم التعليمات القديم', () => {
  const h = harness({ ai_enabled: false, custom_instructions: 'تعليمات قديمة' });
  h.state.publish_job_j1 = { id: 'j1', raw_text: '  موعد مهم  ', media: [], status: 'pending' };
  h.run('_process_publish_job', { options: { job_id: 'j1' } });
  assert.equal(h.state.publish_job_j1.formatted_text, 'موعد مهم');
  assert.equal(h.state.publish_job_j1.formatting_mode, 'local');
});

test('الصورة والمستند والتكملة النصية لا تُحسم إلا بعد كل on_result', () => {
  const h = harness({ university_projects: projects, admin_id: 1 });
  h.state.publish_job_j2 = {
    id: 'j2', target_channel: '@target1', source_id: '@mapped', source_type: 'telegram', source_post_id: '50',
    raw_text: 'أ'.repeat(1800), formatted_text: 'أ'.repeat(1800), media: [{ type: 'photo', id: 'p' }, { type: 'document', id: 'd' }],
    status: 'ready', step: 'media', media_index: 0, text_index: 0, attempts: 0, notify: false
  };
  h.run('_publish_next', { options: { job_id: 'j2' } });
  assert.equal(h.sent[0].method, 'sendPhoto');
  assert.ok(h.sent[0].request.caption);
  assert.equal(h.state.publication_v2_j2, undefined);
  h.run('_on_publish_result', { options: { bb_options: { job_id: 'j2' } } });
  h.run('_publish_next', { options: { job_id: 'j2' } });
  assert.equal(h.sent[1].method, 'sendDocument');
  assert.equal(h.sent[1].request.caption, undefined);
  h.run('_on_publish_result', { options: { bb_options: { job_id: 'j2' } } });
  h.run('_publish_next', { options: { job_id: 'j2' } });
  assert.equal(h.sent[2].method, 'sendMessage');
  h.run('_on_publish_result', { options: { bb_options: { job_id: 'j2' } } });
  h.run('_publish_next', { options: { job_id: 'j2' } });
  assert.equal(h.sent[3].method, 'sendMessage');
  h.run('_on_publish_result', { options: { bb_options: { job_id: 'j2' } } });
  h.run('_publish_next', { options: { job_id: 'j2' } });
  assert.ok(h.state.publication_v2_j2);
  assert.equal(h.state.publish_job_j2, null);
});

test('فشل تيليجرام يحتفظ بالمهمة ويجدول إعادة المحاولة دون علامة نشر', () => {
  const h = harness();
  h.state.publish_job_j3 = { id: 'j3', attempts: 0, target_channel: '@t', source_id: '@s', notify: false };
  h.run('_on_publish_error', { options: { bb_options: { job_id: 'j3' }, error: 'network down' } });
  assert.equal(h.state.publish_job_j3.status, 'pending_retry');
  assert.equal(h.state.publication_v2_j3, undefined);
  assert.equal(h.scheduled[0].command, '/publish_next');
});

test('RSS/CDATA في X يعالج عنصرين ويستخرج الصور الأصلية', () => {
  const h = harness({ university_projects: projects });
  const xml = `<rss><channel>
  <item><title><![CDATA[موعد قصير]]></title><guid>https://x.com/mappedx/status/101</guid><link>https://x.com/mappedx/status/101</link><description><![CDATA[<p>تذكير مهم</p><img src="https://nitter.example/pic/orig/media%2Fa.jpg"/><img src="https://nitter.example/pic/orig/media%2Fb.jpg"/>]]></description></item>
  <item><title>إعلان ثانٍ</title><guid>https://x.com/mappedx/status/102</guid><link>https://x.com/mappedx/status/102</link><description>نص آخر</description></item>
  </channel></rss>`;
  h.run('_on_twitter_success', { params: 'u1|mappedx', content: xml });
  const submissions = h.calls.filter(c => c.command === '/submit_post');
  assert.equal(submissions.length, 2);
  assert.equal(submissions[0].options.media.length, 2);
  assert.equal(submissions[0].options.media[0].id, 'https://pbs.twimg.com/media/a.jpg');
  assert.equal(submissions[0].options.source_post_id, '101');
});

test('Google News يقبل العنوان المطابق الحديث ويرفض العام والقديم', () => {
  const h = harness({ university_projects: projects });
  const fresh = new Date(Date.now() - 3600000).toUTCString();
  const old = new Date(Date.now() - 40 * 86400000).toUTCString();
  const xml = `<rss><channel>
  <item><title>جامعة الاختبار تعلن موعد القبول - صحيفة</title><link>https://news/1</link><pubDate>${fresh}</pubDate></item>
  <item><title>قبول وتسجيل في جامعات أخرى</title><link>https://news/2</link><pubDate>${fresh}</pubDate></item>
  <item><title>جامعة الاختبار - خبر قديم</title><link>https://news/3</link><pubDate>${old}</pubDate></item>
  </channel></rss>`;
  h.run('_on_google_news_success', { params: 'u1', content: xml });
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].options.source_post_id, 'https://news/1');
});

test('أول فحص لتيليجرام يثبت المؤشر ولا ينشر الأرشيف', () => {
  const h = harness({ university_projects: projects });
  const html = '<div data-post="mapped/100"></div><div class="tgme_widget_message_text">خبر قديم</div>';
  h.run('_on_crawl_success', { params: 'u1|mapped', content: html });
  assert.equal(h.state.last_crawl_id_mapped, 100);
  assert.equal(h.calls.length, 0);
});

test('التعليمات الدائمة وسياق المحادثة مستقلان لكل مستخدم', () => {
  const h = harness({ admin_id: 7607633343, ai_api_key: 'fixture-key' });
  h.run('_receive_chat', { message: 'تعلم: لا تضف هاشتاجات' });
  assert.deepEqual(h.state.learned_instructions, ['لا تضف هاشتاجات']);
  h.run('_receive_chat', { message: 'سؤال أول' });
  const http1 = h.calls.find(c => c.httpPost).httpPost;
  h.run('_on_chat_success', { user: { telegramid: 7607633343 }, content: JSON.stringify({ choices: [{ message: { content: 'جواب أول' } }] }) });
  h.run('_receive_chat', { message: 'سؤال ثانٍ' });
  const posts = h.calls.filter(c => c.httpPost);
  assert.ok(posts[1].httpPost.body.messages.some(m => m.content === 'جواب أول'));
  assert.ok(http1.body.messages.some(m => m.content === 'سؤال أول'));
});

test('رد التعليق يرتبط بالرسالة ويحفظ سياق صاحبه', () => {
  const h = harness();
  h.state.comment_ctx_7_9 = { chat_id: -1001, message_id: 9, user_id: 7, text: 'ما الموعد؟' };
  h.run('_on_comment_ai_success', { params: 'comment_ctx_7_9', content: JSON.stringify({ choices: [{ message: { content: 'لا أستطيع تأكيده دون المصدر الرسمي.' } }] }) });
  assert.equal(h.sent[0].request.reply_to_message_id, 9);
  assert.equal(h.state.comment_history_7.length, 2);
});

if (!process.exitCode) console.log(`\nنجحت ${passed} اختبارًا محليًا دون شبكة أو نشر خارجي.`);
