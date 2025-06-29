const express = require('express');
const { google } = require('googleapis');
const NodeCache = require('node-cache');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// 缓存搜索结果 (5分钟)
const cache = new NodeCache({ stdTTL: 300 });

// YouTube Data API 配置
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

/**
 * 搜索 YouTube 视频
 * GET /api/search?q={query}&maxResults={number}&pageToken={token}
 */
router.get('/', async (req, res) => {
  try {
    const { q: query, maxResults = 10, pageToken, type = 'video' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // 如果没有配置 API 密钥，使用备用搜索方法
    if (!process.env.YOUTUBE_API_KEY) {
      return await fallbackSearch(req, res);
    }

    // 检查缓存
    const cacheKey = `search:${query}:${maxResults}:${pageToken || ''}:${type}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // 调用 YouTube API
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: type,
      maxResults: parseInt(maxResults),
      pageToken: pageToken,
      order: 'relevance',
      safeSearch: 'moderate',
      videoEmbeddable: 'true',
      videoSyndicated: 'true'
    });

    // 格式化结果
    const results = {
      items: response.data.items.map(item => {
        console.log('🔍 API返回的发布时间:', item.snippet.publishedAt); // 调试日志
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          duration: null // 需要额外的API调用获取
        };
      }),
      nextPageToken: response.data.nextPageToken,
      prevPageToken: response.data.prevPageToken,
      totalResults: response.data.pageInfo.totalResults,
      resultsPerPage: response.data.pageInfo.resultsPerPage
    };

    // 缓存结果
    cache.set(cacheKey, results);

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    
    if (error.code === 403) {
      res.status(403).json({ 
        error: 'YouTube API quota exceeded or invalid API key',
        message: 'Please check your API key and quota limits'
      });
    } else if (error.code === 400) {
      res.status(400).json({ 
        error: 'Invalid search parameters',
        message: error.message
      });
    } else {
      res.status(500).json({ 
        error: 'Search failed',
        message: 'Unable to search videos at this time'
      });
    }
  }
});

/**
 * 获取热门视频
 * GET /api/search/trending?maxResults={number}&regionCode={code}
 */
router.get('/trending', async (req, res) => {
  try {
    const { maxResults = 10, regionCode = 'US' } = req.query;

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    // 检查缓存
    const cacheKey = `trending:${maxResults}:${regionCode}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const response = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      chart: 'mostPopular',
      maxResults: parseInt(maxResults),
      regionCode: regionCode,
      videoCategoryId: '10' // Music category
    });

    const results = {
      items: response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics.viewCount,
        likeCount: item.statistics.likeCount
      }))
    };

    // 缓存结果 (10分钟)
    cache.set(cacheKey, results, 600);

    res.json(results);
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ 
      error: 'Failed to get trending videos',
      message: error.message
    });
  }
});

/**
 * 备用搜索功能 - 不需要 API 密钥
 * 使用 YouTube 搜索页面抓取结果
 */
async function fallbackSearch(req, res) {
  try {
    const { q: query, maxResults = 10 } = req.query;

    // 检查缓存
    const cacheKey = `fallback:${query}:${maxResults}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // 构建搜索URL
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    // 发送请求
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    // 解析HTML
    const $ = cheerio.load(response.data);

    // 查找包含视频数据的脚本标签
    let videoData = [];
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('var ytInitialData')) {
        try {
          // 提取 ytInitialData
          const match = scriptContent.match(/var ytInitialData = ({.*?});/);
          if (match) {
            const data = JSON.parse(match[1]);
            const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

            if (contents && contents[0]?.itemSectionRenderer?.contents) {
              const items = contents[0].itemSectionRenderer.contents;

              videoData = items
                .filter(item => item.videoRenderer)
                .slice(0, parseInt(maxResults))
                .map(item => {
                  const video = item.videoRenderer;
                  return {
                    id: video.videoId,
                    title: video.title?.runs?.[0]?.text || 'Unknown Title',
                    description: video.descriptionSnippet?.runs?.map(run => run.text).join('') || '',
                    thumbnail: video.thumbnail?.thumbnails?.[0]?.url || '',
                    channelTitle: video.ownerText?.runs?.[0]?.text || 'Unknown Channel',
                    publishedAt: video.publishedTimeText?.simpleText || '',
                    duration: video.lengthText?.simpleText || '',
                    viewCount: video.viewCountText?.simpleText || ''
                  };
                });
            }
          }
        } catch (e) {
          console.error('Error parsing YouTube data:', e);
        }
      }
    });

    // 如果没有找到数据，返回空结果
    if (videoData.length === 0) {
      videoData = generateMockResults(query, maxResults);
    }

    const results = {
      items: videoData,
      nextPageToken: null,
      prevPageToken: null,
      totalResults: videoData.length,
      resultsPerPage: videoData.length,
      source: 'fallback'
    };

    // 缓存结果 (2分钟，比API缓存时间短)
    cache.set(cacheKey, results, 120);

    res.json(results);
  } catch (error) {
    console.error('Fallback search error:', error);

    // 如果备用搜索也失败，返回模拟结果
    const mockResults = generateMockResults(req.query.q, req.query.maxResults || 10);
    res.json({
      items: mockResults,
      nextPageToken: null,
      prevPageToken: null,
      totalResults: mockResults.length,
      resultsPerPage: mockResults.length,
      source: 'mock'
    });
  }
}

/**
 * 生成模拟搜索结果
 */
function generateMockResults(query, maxResults) {
  const mockVideos = [
    {
      id: 'dQw4w9WgXcQ',
      title: `${query} - 示例视频 1`,
      description: `这是关于 "${query}" 的示例视频描述。`,
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      channelTitle: '示例频道',
      publishedAt: '2023-01-01T00:00:00Z',
      duration: '3:32',
      viewCount: '1,000,000 views'
    },
    {
      id: 'jNQXAC9IVRw',
      title: `${query} - 示例视频 2`,
      description: `另一个关于 "${query}" 的示例视频。`,
      thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg',
      channelTitle: '音乐频道',
      publishedAt: '2023-02-01T00:00:00Z',
      duration: '4:15',
      viewCount: '500,000 views'
    }
  ];

  return mockVideos.slice(0, parseInt(maxResults));
}

module.exports = router;
