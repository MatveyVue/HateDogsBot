import http from 'node:http';
import { URLSearchParams } from 'node:url';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

const VERIFIED_STATUSES = ['member', 'administrator', 'creator', 'restricted'];

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST' || req.url !== '/verify') {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Not found' }));
        return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;

    let payload = {};
    try {
        payload = JSON.parse(body || '{}');
    } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: 'Bad JSON' }));
        return;
    }

    const { chatId, telegramUserId } = payload;

    if (!BOT_TOKEN) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: 'BOT_TOKEN not set on server' }));
        return;
    }

    if (!chatId || !telegramUserId) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: 'chatId and telegramUserId required' }));
        return;
    }

    try {
        const url =
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?` +
            new URLSearchParams({ chat_id: String(chatId), user_id: String(telegramUserId) });

        const r = await fetch(url);
        const data = await r.json();

        if (!data.ok) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: data.description }));
            return;
        }

        const status = data.result?.status;
        const success = VERIFIED_STATUSES.includes(status);

        res.writeHead(200);
        res.end(JSON.stringify({ success, status }));
    } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: e.message }));
    }
});

server.listen(PORT, () => {
    console.log(`Ton Bot verifier listening on :${PORT}`);
});