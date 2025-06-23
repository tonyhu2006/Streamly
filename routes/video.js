const express = require('express');
const { google } = require('googleapis');
const YTDlpWrap = require('yt-dlp-wrap').default;
const NodeCache = require('node-cache');
const router = express.Router();

// 缓存视频信息 (30分钟)
const cache = new NodeCache({ stdTTL: 1800 });

// YouTube Data API 配置
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// yt-dlp 实例
const ytDlp = new YTDlpWrap();

/**
 * 获取视频详细信息
 * GET /api/video/{videoId}/info
 */
router.get('/:videoId/info', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // 检查缓存
    const cacheKey = `video:info:${videoId}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    let videoInfo = {};

    // 尝试使用 YouTube API 获取信息
    if (process.env.YOUTUBE_API_KEY) {
      try {
        const response = await youtube.videos.list({
          part: ['snippet', 'contentDetails', 'statistics'],
          id: videoId
        });

        if (response.data.items.length > 0) {
          const item = response.data.items[0];
          videoInfo = {
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            duration: item.contentDetails.duration,
            viewCount: item.statistics.viewCount,
            likeCount: item.statistics.likeCount,
            source: 'youtube-api'
          };
        }
      } catch (apiError) {
        console.warn('YouTube API failed, falling back to yt-dlp:', apiError.message);
      }
    }

    // 如果 API 失败，使用 yt-dlp 获取信息
    if (!videoInfo.title) {
      try {
        const ytDlpInfo = await ytDlp.getVideoInfo(`https://www.youtube.com/watch?v=${videoId}`);
        
        videoInfo = {
          id: videoId,
          title: ytDlpInfo.title,
          description: ytDlpInfo.description,
          thumbnail: ytDlpInfo.thumbnail,
          channelTitle: ytDlpInfo.uploader,
          publishedAt: ytDlpInfo.upload_date,
          duration: ytDlpInfo.duration,
          viewCount: ytDlpInfo.view_count,
          source: 'yt-dlp'
        };
      } catch (ytDlpError) {
        console.error('yt-dlp failed:', ytDlpError.message);
        return res.status(404).json({ 
          error: 'Video not found or unavailable',
          message: 'Unable to retrieve video information'
        });
      }
    }

    // 缓存结果
    cache.set(cacheKey, videoInfo);

    res.json(videoInfo);
  } catch (error) {
    console.error('Video info error:', error);
    res.status(500).json({ 
      error: 'Failed to get video information',
      message: error.message
    });
  }
});

/**
 * 获取视频流URL
 * GET /api/video/{videoId}/stream?quality={quality}
 */
router.get('/:videoId/stream', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { quality = 'best' } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // 检查缓存 (5分钟缓存，因为流URL会过期)
    const cacheKey = `video:stream:${videoId}:${quality}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    try {
      // 使用 yt-dlp 获取流URL
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // 获取可用格式
      const formats = await ytDlp.getVideoInfo(videoUrl);
      
      // 根据质量选择最佳格式
      let selectedFormat = null;
      
      if (quality === 'best') {
        // 选择最高质量的视频+音频格式
        selectedFormat = formats.formats?.find(f => 
          f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4'
        ) || formats.formats?.find(f => f.vcodec !== 'none' && f.acodec !== 'none');
      } else if (quality === 'audio') {
        // 仅音频
        selectedFormat = formats.formats?.find(f => 
          f.vcodec === 'none' && f.acodec !== 'none'
        );
      } else {
        // 根据指定质量查找
        selectedFormat = formats.formats?.find(f => 
          f.height && f.height.toString() === quality && f.acodec !== 'none'
        );
      }

      if (!selectedFormat) {
        return res.status(404).json({ 
          error: 'No suitable format found',
          message: `No ${quality} quality stream available for this video`
        });
      }

      const streamInfo = {
        url: selectedFormat.url,
        quality: selectedFormat.height || 'audio',
        format: selectedFormat.ext,
        filesize: selectedFormat.filesize,
        duration: formats.duration,
        title: formats.title
      };

      // 短时间缓存 (5分钟)
      cache.set(cacheKey, streamInfo, 300);

      res.json(streamInfo);
    } catch (ytDlpError) {
      console.error('yt-dlp stream error:', ytDlpError.message);
      res.status(404).json({ 
        error: 'Video stream not available',
        message: 'Unable to extract video stream. Video may be private or restricted.'
      });
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ 
      error: 'Failed to get video stream',
      message: error.message
    });
  }
});

/**
 * 代理视频流 (可选)
 * GET /api/video/{videoId}/proxy?quality={quality}
 */
router.get('/:videoId/proxy', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { quality = 'best' } = req.query;

    // 获取流信息
    const streamResponse = await fetch(`${req.protocol}://${req.get('host')}/api/video/${videoId}/stream?quality=${quality}`);
    const streamInfo = await streamResponse.json();

    if (!streamInfo.url) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // 设置适当的头部
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // 代理流
    const https = require('https');
    const http = require('http');
    const url = require('url');

    const parsedUrl = url.parse(streamInfo.url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const request = protocol.get(streamInfo.url, (streamRes) => {
      res.setHeader('Content-Length', streamRes.headers['content-length']);
      streamRes.pipe(res);
    });

    request.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).json({ error: 'Failed to proxy stream' });
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy video stream',
      message: error.message
    });
  }
});

module.exports = router;
