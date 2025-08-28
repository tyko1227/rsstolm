// 피드 추가 (POST /feeds)
app.post('/feeds', (req, res) => {
    try {
        const { url, title } = req.body;
        if (!url || !title) return res.status(400).json({ error: 'url, title required' });
        const feedsPath = path.join(__dirname, 'feeds.json');
        let feeds = [];
        if (fs.existsSync(feedsPath)) {
            feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
        }
        if (feeds.some(f => f.url === url)) return res.status(409).json({ error: 'already exists' });
        feeds.push({ url, title });
        fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'server error' });
    }
});
const fs = require('fs');
// ...existing code...
// 저장된 피드 목록 반환 (GET /feeds)
app.get('/feeds', (req, res) => {
    try {
        const feedsPath = path.join(__dirname, 'feeds.json');
        if (!fs.existsSync(feedsPath)) return res.json([]);
        const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
        res.json(feeds);
    } catch (err) {
        res.status(500).json([]);
    }
});
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());
const SHEET_ID = '1XM8V3HrnLqEowJryxQYi_-xGM1UXvBQ8o3JPdd-SML4';
const SHEET_RANGE = 'Sheet1!A:B'; // A: url, B: title
const GOOGLE_KEY = require('../구글APi키/api-project-542085203624-fd37f93f89f9.json');

function getSheetsClient() {
    return new google.auth.JWT(
        GOOGLE_KEY.client_email,
        null,
        GOOGLE_KEY.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );
}
// 정적 파일 서빙 (깃허브 Pages 호환)
// Google Sheets에서 피드 목록 읽기
async function getFeedsFromSheet() {
    const auth = getSheetsClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: SHEET_RANGE });
    const rows = res.data.values || [];
    return rows.map(r => ({ url: r[0], title: r[1] }));
}

// Google Sheets에 피드 추가
async function addFeedToSheet(url, title) {
    const auth = getSheetsClient();
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGE,
        valueInputOption: 'RAW',
        requestBody: { values: [[url, title]] }
    });
}
app.use(express.static(path.join(__dirname)));

// RSS/Atom 피드 파싱 및 키워드 필터링
app.post('/process-rss', async (req, res) => {
    try {
        const { rssUrl, keywords } = req.body;
        // 웹상의 주소, .xml 파일 모두 axios로 요청 가능 (User-Agent 추가)
        const response = await axios.get(rssUrl, {
            responseType: 'text',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });
// Google Sheets에서 피드 목록 반환 (GET /feeds)

        let items = [];
        const feeds = await getFeedsFromSheet();
        res.json(feeds);
        // Atom
        else if (result.feed && result.feed.entry) {
            items = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
        }

        // 키워드가 없거나 모두 빈 값이면 전체 기사 반환 (RSS 리더 기능)
        let filteredArticles = items;
        if (Array.isArray(keywords) && keywords.some(k => k.trim())) {
            filteredArticles = items.filter(item => {
                const title = item.title || '';
                const description = item.description || item.summary || item.content || '';
                const content = `${title} ${description}`.toLowerCase();
                return keywords.some(keyword => keyword && content.includes(keyword.toLowerCase()));
            });
        }
        filteredArticles = filteredArticles.map(item => {
            // 링크 추출 (RSS/Atom 모두 대응)
            let link = '#';
            if (item.link) {
                if (typeof item.link === 'string') link = item.link;
                else if (item.link.href) link = item.link.href;
                else if (Array.isArray(item.link)) {
                    // Atom: link 배열에서 rel="alternate" 우선
                    const alt = item.link.find(l => l.rel === 'alternate');
// Google Sheets에 피드 추가 (POST /feeds)
app.post('/feeds', async (req, res) => {
    try {
        const { url, title } = req.body;
        if (!url || !title) return res.status(400).json({ error: 'url, title required' });
        const feeds = await getFeedsFromSheet();
        if (feeds.some(f => f.url === url)) return res.status(409).json({ error: 'already exists' });
        await addFeedToSheet(url, title);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'server error' });
    }
});
                    link = (alt && alt.href) || item.link[0].href || item.link[0];
                }
            }
            return {
                title: item.title || '제목 없음',
                description: item.description || item.summary || item.content || '',
                link
            };
        });

        res.json({ articles: filteredArticles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'RSS 처리 중 오류 발생' });
    }
});

// 깃허브 Pages 호환: 3000 포트가 아닌 환경도 지원
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
