import fetch from 'node-fetch';
import options from './options.js';

export default async function sendTelegram (...args) {
  try {
    const formatted = encodeURIComponent(['*Module ' + options.name + ':*', ...args].join('\n'));
    await fetch(`https://api.telegram.org/bot${options.botToken}/sendMessage?chat_id=${options.chatId}&parse_mode=Markdown&text=${formatted}`);
  } catch (error) {
    log.error(new Date().toISOString(), 'Failed to send telegram', error);
  }
}
