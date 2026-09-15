const VERIFIED_STATUSES = ['member', 'administrator', 'creator', 'restricted'];

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!BOT_TOKEN) {
        res.status(500).json({ success: false, message: 'BOT_TOKEN is not set in Vercel env' });
        return;
    }

    let payload = {};
    try {
        payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        res.status(400).json({ success: false, message: 'Bad JSON' });
        return;
    }

    const { chatId, telegramUserId } = payload;

    if (!chatId || !telegramUserId) {
        res.status(400).json({ success: false, message: 'chatId and telegramUserId required' });
        return;
    }

    try {
        const url =
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?` +
            new URLSearchParams({ chat_id: String(chatId), user_id: String(telegramUserId) });

        const r = await fetch(url);
        const data = await r.json();

        if (!data.ok) {
            res.status(200).json({ success: false, message: data.description });
            return;
        }

        const status = data.result?.status;
        res.status(200).json({ success: VERIFIED_STATUSES.includes(status), status });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}