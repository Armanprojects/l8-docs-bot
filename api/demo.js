// Helper to read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read and parse body manually
  let body;
  try {
    const rawBody = await getRawBody(req);
    body = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  const { name, email, phone, employees, source } = body || {};

  if (!name || !email || !employees) {
    return res.status(400).json({ error: 'Name, Email, and Employees are required' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

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
      return res.status(500).json({ error: 'Failed to send to Telegram' });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
