export default async function handler(req, res) {
  // 1. CORS Configuration
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // В Vercel req.body уже распарсен, если Content-Type: application/json
  // Использование ручного чтения потока (req.on('data')) может привести к зависанию
  const body = req.body;

  const { name, email, phone, employees, source } = body || {};

  if (!name || !email || !employees) {
    return res.status(400).json({ 
      error: 'Name, Email, and Employees are required',
      received: body 
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Server configuration error: missing token or chatId' });
  }

  // Форматирование источника для читаемости
  const sourceMap = {
    'hero_section': 'Hero Section (Главный экран)',
    'final_cta_section': 'Final CTA Section (Финальный призыв)',
  };

  const formattedSource = sourceMap[source] || source || 'unknown';

  const text = `📩 *Новая заявка на демо L8 DOCS!*
━━━━━━━━━━━━━━━━━━━━━━
👤 *Имя:* ${name}
📧 *Email:* ${email}
📱 *Телефон:* ${phone || 'Не указан'}
👥 *Сотрудников:* ${employees}
📍 *Источник:* ${formattedSource}
━━━━━━━━━━━━━━━━━━━━━━
🕒 *Время:* ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    if (result.ok) {
      return res.status(200).json({ success: true, message: 'Sent to Telegram' });
    } else {
      console.error('Telegram API error:', result);
      return res.status(500).json({ error: 'Failed to send to Telegram', telegramResponse: result });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
