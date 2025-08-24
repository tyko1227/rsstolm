const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();

app.use(bodyParser.json());

app.post('/process-rss', async (req, res) => {
    try {
        const { rssUrl, keywords } = req.body;
        
        // RSS 피드 가져오기
        const response = await axios.get(rssUrl);
        const result = await xml2js.parseStringPromise(response.data);
        
        // 아이템 추출 (RSS 형식에 따라 다름)
        const items = result.rss.channel[0].item || result.feed.entry || [];
        
        // 키워드 필터링
        const filteredArticles = items
            .filter(item => {
                const title = item.title?.[0] || '';
                const description = item.description?.[0] || '';
                const content = `${title} ${description}`.toLowerCase();
                
                return keywords.some(keyword => 
                    keyword && content.includes(keyword.toLowerCase())
                );
            })
            .map(item => ({
                title: item.title?.[0] || '제목 없음',
                description: item.description?.[0] || item.content?.[0] || '',
                link: item.link?.[0] || item.link?.[0].$.href || '#'
            }));
            
        res.json({ articles: filteredArticles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'RSS 처리 중 오류 발생' });
    }
});

app.listen(3000, () => console.log('서버 실행 중: http://localhost:3000'));
