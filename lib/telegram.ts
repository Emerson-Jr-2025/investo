const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function call(method: string, body: object) {
  await fetch(`${BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function sendMessage(chatId: number | string, text: string, extra?: object) {
  return call('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', ...extra })
}

export function answerCallbackQuery(id: string, text?: string) {
  return call('answerCallbackQuery', { callback_query_id: id, text })
}

export function editMessageText(chatId: number | string, messageId: number, text: string) {
  return call('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown' })
}

export function setWebhook(url: string) {
  return fetch(`${BASE}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, allowed_updates: ['message', 'callback_query'] }),
  }).then((r) => r.json())
}
