const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

// 播放列表存储目录
const PLAYLISTS_DIR = path.join(__dirname, '..', 'data', 'playlists');

// 确保目录存在
async function ensurePlaylistsDir() {
  try {
    await fs.access(PLAYLISTS_DIR);
  } catch {
    await fs.mkdir(PLAYLISTS_DIR, { recursive: true });
  }
}

/**
 * 保存播放列表
 * POST /api/playlist
 * Body: { name: string, videos: Array, description?: string }
 */
router.post('/', async (req, res) => {
  try {
    const { name, videos, description = '' } = req.body;
    
    if (!name || !videos || !Array.isArray(videos)) {
      return res.status(400).json({ 
        error: 'Invalid playlist data',
        message: 'Name and videos array are required'
      });
    }

    await ensurePlaylistsDir();

    // 生成唯一ID
    const playlistId = crypto.randomBytes(16).toString('hex');
    
    const playlist = {
      id: playlistId,
      name: name,
      description: description,
      videos: videos.map(video => ({
        id: video.id || video[2], // 兼容旧格式
        title: video.title || video[0],
        duration: video.duration || video[1],
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      videoCount: videos.length
    };

    const filePath = path.join(PLAYLISTS_DIR, `${playlistId}.json`);
    await fs.writeFile(filePath, JSON.stringify(playlist, null, 2));

    res.status(201).json({
      success: true,
      playlist: {
        id: playlistId,
        name: playlist.name,
        videoCount: playlist.videoCount,
        createdAt: playlist.createdAt
      }
    });
  } catch (error) {
    console.error('Save playlist error:', error);
    res.status(500).json({ 
      error: 'Failed to save playlist',
      message: error.message
    });
  }
});

/**
 * 获取播放列表
 * GET /api/playlist/{playlistId}
 */
router.get('/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    if (!playlistId || !/^[a-f0-9]{32}$/.test(playlistId)) {
      return res.status(400).json({ 
        error: 'Invalid playlist ID',
        message: 'Playlist ID must be a valid 32-character hex string'
      });
    }

    await ensurePlaylistsDir();

    const filePath = path.join(PLAYLISTS_DIR, `${playlistId}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const playlist = JSON.parse(data);
      res.json(playlist);
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.status(404).json({ 
          error: 'Playlist not found',
          message: 'The requested playlist does not exist'
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ 
      error: 'Failed to get playlist',
      message: error.message
    });
  }
});

/**
 * 更新播放列表
 * PUT /api/playlist/{playlistId}
 * Body: { name?: string, videos?: Array, description?: string }
 */
router.put('/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, videos, description } = req.body;
    
    if (!playlistId || !/^[a-f0-9]{32}$/.test(playlistId)) {
      return res.status(400).json({ 
        error: 'Invalid playlist ID'
      });
    }

    await ensurePlaylistsDir();

    const filePath = path.join(PLAYLISTS_DIR, `${playlistId}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const playlist = JSON.parse(data);
      
      // 更新字段
      if (name !== undefined) playlist.name = name;
      if (description !== undefined) playlist.description = description;
      if (videos !== undefined) {
        playlist.videos = videos.map(video => ({
          id: video.id || video[2],
          title: video.title || video[0],
          duration: video.duration || video[1],
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle
        }));
        playlist.videoCount = videos.length;
      }
      
      playlist.updatedAt = new Date().toISOString();

      await fs.writeFile(filePath, JSON.stringify(playlist, null, 2));

      res.json({
        success: true,
        playlist: {
          id: playlist.id,
          name: playlist.name,
          videoCount: playlist.videoCount,
          updatedAt: playlist.updatedAt
        }
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.status(404).json({ 
          error: 'Playlist not found'
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ 
      error: 'Failed to update playlist',
      message: error.message
    });
  }
});

/**
 * 删除播放列表
 * DELETE /api/playlist/{playlistId}
 */
router.delete('/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    if (!playlistId || !/^[a-f0-9]{32}$/.test(playlistId)) {
      return res.status(400).json({ 
        error: 'Invalid playlist ID'
      });
    }

    await ensurePlaylistsDir();

    const filePath = path.join(PLAYLISTS_DIR, `${playlistId}.json`);
    
    try {
      await fs.unlink(filePath);
      res.json({ 
        success: true,
        message: 'Playlist deleted successfully'
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.status(404).json({ 
          error: 'Playlist not found'
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ 
      error: 'Failed to delete playlist',
      message: error.message
    });
  }
});

/**
 * 列出所有播放列表 (可选功能)
 * GET /api/playlist
 */
router.get('/', async (req, res) => {
  try {
    await ensurePlaylistsDir();

    const files = await fs.readdir(PLAYLISTS_DIR);
    const playlists = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(path.join(PLAYLISTS_DIR, file), 'utf8');
          const playlist = JSON.parse(data);
          playlists.push({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            videoCount: playlist.videoCount,
            createdAt: playlist.createdAt,
            updatedAt: playlist.updatedAt
          });
        } catch (parseError) {
          console.warn(`Failed to parse playlist file ${file}:`, parseError.message);
        }
      }
    }

    // 按创建时间排序
    playlists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      playlists: playlists,
      total: playlists.length
    });
  } catch (error) {
    console.error('List playlists error:', error);
    res.status(500).json({ 
      error: 'Failed to list playlists',
      message: error.message
    });
  }
});

module.exports = router;
