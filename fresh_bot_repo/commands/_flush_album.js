/*CMD
  command: /flush_album
  help: إرسال ألبوم مجمع إلى طابور النشر
  need_reply: false
  auto_retry_time:
  folder:
  answer:
  keyboard:
  aliases:
CMD*/

if (!options || !options.album_key) return;
var album = Bot.getProperty(options.album_key);
if (!album || !album.submission) return;
album.submission.media = album.media || [];
album.submission.raw_text = album.text || album.submission.raw_text || "";
Bot.setProperty(options.album_key, null, "json");
Bot.runCommand("/submit_post", album.submission);
