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
const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// 정적 파일 서빙 (깃허브 Pages 호환)
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
        const result = await xml2js.parseStringPromise(response.data, { explicitArray: false, mergeAttrs: true });

        let items = [];
        // RSS 2.0
        if (result.rss && result.rss.channel && result.rss.channel.item) {
            items = Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item];
        }
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
