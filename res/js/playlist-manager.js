/**
 * Streamly 播放列表管理器
 * 管理用户的自定义播放列表
 */

class PlaylistManager {
    constructor() {
        this.playlists = {};
        this.selectedVideos = new Set();
        this.currentAction = null; // 'add' 或 'select'
        this.pendingVideos = [];
        
        this.loadPlaylists();
        this.initializeUI();
    }
    
    /**
     * 从本地存储加载播放列表
     */
    loadPlaylists() {
        try {
            const saved = localStorage.getItem('streamly-playlists');
            if (saved) {
                this.playlists = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('无法加载播放列表:', e);
            this.playlists = {};
        }
    }
    
    /**
     * 保存播放列表到本地存储
     */
    savePlaylists() {
        try {
            localStorage.setItem('streamly-playlists', JSON.stringify(this.playlists));
        } catch (e) {
            console.error('无法保存播放列表:', e);
            this.showNotification('保存播放列表失败', 'error');
        }
    }
    
    /**
     * 初始化UI
     */
    initializeUI() {
        document.addEventListener('DOMContentLoaded', () => {
            this.updatePlaylistsUI();
            this.setupSearchResultsObserver();
        });
    }
    
    /**
     * 创建新播放列表
     */
    createPlaylist(name, description = '') {
        if (!name || name.trim() === '') {
            this.showNotification('请输入播放列表名称', 'warning');
            return false;
        }
        
        const playlistId = this.generatePlaylistId();
        const playlist = {
            id: playlistId,
            name: name.trim(),
            description: description.trim(),
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.playlists[playlistId] = playlist;
        this.savePlaylists();
        this.updatePlaylistsUI();
        this.showNotification(`播放列表 "${name}" 创建成功`, 'success');
        
        // 清空输入框
        const nameInput = document.getElementById('newPlaylistName');
        const descInput = document.getElementById('newPlaylistDescription');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        
        return true;
    }
    
    /**
     * 删除播放列表
     */
    deletePlaylist(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return;
        
        if (confirm(`确定要删除播放列表 "${playlist.name}" 吗？此操作无法撤销。`)) {
            delete this.playlists[playlistId];
            this.savePlaylists();
            this.updatePlaylistsUI();
            this.showNotification(`播放列表 "${playlist.name}" 已删除`, 'success');
        }
    }
    
    /**
     * 添加视频到播放列表
     */
    addVideoToPlaylist(playlistId, video) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return false;
        
        // 检查视频是否已存在
        const exists = playlist.videos.some(v => v.id === video.id);
        if (exists) {
            this.showNotification('视频已在播放列表中', 'warning');
            return false;
        }
        
        playlist.videos.push({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            duration: video.duration,
            addedAt: new Date().toISOString()
        });
        
        playlist.updatedAt = new Date().toISOString();
        this.savePlaylists();
        this.updatePlaylistsUI();
        
        return true;
    }
    
    /**
     * 从播放列表移除视频
     */
    removeVideoFromPlaylist(playlistId, videoId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return;
        
        playlist.videos = playlist.videos.filter(v => v.id !== videoId);
        playlist.updatedAt = new Date().toISOString();
        this.savePlaylists();
        this.updatePlaylistsUI();
        this.showNotification('视频已从播放列表中移除', 'success');
    }
    
    /**
     * 批量添加选中的视频到播放列表
     */
    addSelectedVideosToPlaylist(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist || this.pendingVideos.length === 0) return;
        
        let addedCount = 0;
        this.pendingVideos.forEach(video => {
            if (this.addVideoToPlaylist(playlistId, video)) {
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            this.showNotification(`成功添加 ${addedCount} 个视频到 "${playlist.name}"`, 'success');
        }
        
        this.pendingVideos = [];
        this.selectedVideos.clear();
        this.updateSelectedCount();
    }
    
    /**
     * 生成播放列表ID
     */
    generatePlaylistId() {
        return 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 更新播放列表UI
     */
    updatePlaylistsUI() {
        const container = document.getElementById('playlistsList');
        if (!container) return;
        
        const playlistIds = Object.keys(this.playlists);
        
        if (playlistIds.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无播放列表，创建一个开始吧！</div>';
            return;
        }
        
        container.innerHTML = playlistIds.map(id => {
            const playlist = this.playlists[id];
            return this.createPlaylistHTML(playlist);
        }).join('');
    }
    
    /**
     * 创建播放列表HTML
     */
    createPlaylistHTML(playlist) {
        const videoCount = playlist.videos.length;
        const lastUpdated = new Date(playlist.updatedAt).toLocaleDateString('zh-CN');
        
        return `
            <div class="playlist-item" data-playlist-id="${playlist.id}">
                <div class="playlist-header">
                    <div class="playlist-info">
                        <h4 class="playlist-name">${this.escapeHtml(playlist.name)}</h4>
                        <p class="playlist-meta">${videoCount} 个视频 • 更新于 ${lastUpdated}</p>
                        ${playlist.description ? `<p class="playlist-description">${this.escapeHtml(playlist.description)}</p>` : ''}
                    </div>
                    <div class="playlist-actions">
                        <button class="playlist-action-btn" onclick="playlistManager.viewPlaylist('${playlist.id}')" title="查看">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="playlist-action-btn" onclick="playlistManager.deletePlaylist('${playlist.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="playlist-videos" id="playlist-videos-${playlist.id}" style="display: none;">
                    ${playlist.videos.map(video => this.createVideoItemHTML(video, playlist.id)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * 创建视频项HTML
     */
    createVideoItemHTML(video, playlistId) {
        return `
            <div class="playlist-video-item">
                <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" class="video-thumbnail">
                <div class="video-info">
                    <div class="video-title">${this.escapeHtml(video.title)}</div>
                    <div class="video-duration">${video.duration || 'N/A'}</div>
                </div>
                <button class="remove-video-btn" onclick="playlistManager.removeVideoFromPlaylist('${playlistId}', '${video.id}')" title="移除">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * 查看播放列表详情
     */
    viewPlaylist(playlistId) {
        const videosContainer = document.getElementById(`playlist-videos-${playlistId}`);
        if (videosContainer) {
            const isVisible = videosContainer.style.display !== 'none';
            videosContainer.style.display = isVisible ? 'none' : 'block';
        }
    }
    
    /**
     * 更新选中视频计数（已移除）
     */
    updateSelectedCount() {
        // 搜索结果相关功能已移除
    }
    
    /**
     * 设置搜索结果观察器（已移除）
     */
    setupSearchResultsObserver() {
        // 搜索结果相关功能已移除
    }
    
    /**
     * 为搜索结果添加复选框（已移除）
     */
    addCheckboxesToSearchResults() {
        // 搜索结果相关功能已移除
    }
    
    /**
     * 从搜索结果项提取视频数据
     */
    extractVideoDataFromSearchItem(item) {
        const titleElement = item.querySelector('.searchResultTitle') || item.querySelector('h3') || item.querySelector('.title');
        const thumbnailElement = item.querySelector('img');
        const durationElement = item.querySelector('.searchResultDuration') || item.querySelector('.duration');
        const linkElement = item.querySelector('a[href*="youtube.com/watch"]') || item.querySelector('a[href*="youtu.be"]');

        // 尝试从链接中提取视频ID
        let videoId = item.dataset.videoId;
        if (!videoId && linkElement) {
            const href = linkElement.href;
            const match = href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            videoId = match ? match[1] : this.generateVideoId();
        }

        return {
            id: videoId || this.generateVideoId(),
            title: titleElement ? titleElement.textContent.trim() : 'Unknown Title',
            thumbnail: thumbnailElement ? thumbnailElement.src : '',
            duration: durationElement ? durationElement.textContent.trim() : 'N/A'
        };
    }
    
    /**
     * 生成视频ID
     */
    generateVideoId() {
        return 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        const colors = {
            info: '#2196f3',
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 全局播放列表管理器实例
let playlistManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    playlistManager = new PlaylistManager();
});

// 全局函数
function togglePlaylistManager() {
    const window = document.getElementById('playlistManagerWindow');
    if (window) {
        const isVisible = window.style.display !== 'none';
        window.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            // 更新临时播放列表UI
            if (playlistManager) {
                playlistManager.updatePlaylistsUI();
            }

            // 更新本地播放列表UI
            updateLocalPlaylistsUI();

            // 更新状态显示
            updateStatusDisplay();
        }
    }
}

function updateLocalPlaylistsUI() {
    const container = document.getElementById('localPlaylistsList');
    if (!container || !localPlaylistManager) return;

    const playlists = Object.values(localPlaylistManager.playlists);

    if (playlists.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无本地播放列表</div>';
        return;
    }

    container.innerHTML = playlists.map(playlist => {
        const videoCount = playlist.videos.length;
        const lastUpdated = new Date(playlist.updatedAt).toLocaleDateString('zh-CN');
        const isCurrentPlaylist = localPlaylistManager.currentPlaylist === playlist.id;

        return `
            <div class="playlist-item ${isCurrentPlaylist ? 'current-playlist' : ''}" data-playlist-id="${playlist.id}">
                <div class="playlist-header">
                    <div class="playlist-info">
                        <h4 class="playlist-name">${escapeHtml(playlist.name)} ${isCurrentPlaylist ? '(当前)' : ''}</h4>
                        <p class="playlist-meta">${videoCount} 个视频 • 播放 ${playlist.playCount || 0} 次 • 更新于 ${lastUpdated}</p>
                        ${playlist.description ? `<p class="playlist-description">${escapeHtml(playlist.description)}</p>` : ''}
                    </div>
                    <div class="playlist-actions">
                        <button class="playlist-action-btn" onclick="loadLocalPlaylist('${playlist.id}')" title="加载播放列表">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="playlist-action-btn" onclick="viewLocalPlaylist('${playlist.id}')" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="playlist-action-btn" onclick="deleteLocalPlaylist('${playlist.id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="playlist-videos" id="local-playlist-videos-${playlist.id}" style="display: none;">
                    ${playlist.videos.map(video => createLocalVideoItemHTML(video, playlist.id)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function updateStatusDisplay() {
    // 更新当前模式显示
    const modeDisplay = document.getElementById('currentModeDisplay');
    if (modeDisplay && localPlaylistManager) {
        if (localPlaylistManager.isTemporaryQueue) {
            modeDisplay.textContent = '临时播放队列';
            modeDisplay.style.color = '#4fc3f7';
        } else {
            const currentPlaylist = localPlaylistManager.playlists[localPlaylistManager.currentPlaylist];
            modeDisplay.textContent = currentPlaylist ? `播放列表: ${currentPlaylist.name}` : '未知';
            modeDisplay.style.color = '#4caf50';
        }
    }

    // 更新队列视频数量
    const queueCount = document.getElementById('currentQueueCount');
    if (queueCount) {
        const count = (typeof window.videos !== 'undefined' && window.videos) ? window.videos.length : 0;
        queueCount.textContent = count;
    }

    // 更新本地播放列表数量
    const playlistCount = document.getElementById('localPlaylistCount');
    if (playlistCount && localPlaylistManager) {
        playlistCount.textContent = Object.keys(localPlaylistManager.playlists).length;
    }
}

function createLocalVideoItemHTML(video, playlistId) {
    return `
        <div class="playlist-video-item">
            <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" class="video-thumbnail">
            <div class="video-info">
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-duration">${formatDuration(video.duration)}</div>
            </div>
            <button class="remove-video-btn" onclick="removeVideoFromLocalPlaylist('${playlistId}', '${video.id}')" title="移除">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

function loadLocalPlaylist(playlistId) {
    if (localPlaylistManager) {
        localPlaylistManager.loadPlaylistToMain(playlistId);
        updateStatusDisplay();
    }
}

function viewLocalPlaylist(playlistId) {
    const videosContainer = document.getElementById(`local-playlist-videos-${playlistId}`);
    if (videosContainer) {
        const isVisible = videosContainer.style.display !== 'none';
        videosContainer.style.display = isVisible ? 'none' : 'block';
    }
}

function deleteLocalPlaylist(playlistId) {
    if (localPlaylistManager) {
        if (localPlaylistManager.deletePlaylist(playlistId)) {
            updateLocalPlaylistsUI();
            updateStatusDisplay();
        }
    }
}

function removeVideoFromLocalPlaylist(playlistId, videoId) {
    if (localPlaylistManager) {
        const playlist = localPlaylistManager.playlists[playlistId];
        if (playlist) {
            playlist.videos = playlist.videos.filter(v => v.id !== videoId);
            playlist.updatedAt = new Date().toISOString();
            localPlaylistManager.savePlaylists();
            updateLocalPlaylistsUI();
            localPlaylistManager.showNotification('视频已从播放列表中移除', 'success');
        }
    }
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'N/A';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createNewPlaylist() {
    const nameInput = document.getElementById('newPlaylistName');
    const descInput = document.getElementById('newPlaylistDescription');
    
    if (nameInput && playlistManager) {
        const name = nameInput.value.trim();
        const description = descInput ? descInput.value.trim() : '';
        playlistManager.createPlaylist(name, description);
    }
}

// 搜索结果相关功能已移除

function showPlaylistSelector() {
    const modal = document.getElementById('playlistSelectorModal');
    const list = document.getElementById('playlistSelectorList');

    if (!modal || !list || !playlistManager) return;

    const playlistIds = Object.keys(playlistManager.playlists);

    if (playlistIds.length === 0) {
        list.innerHTML = '<div class="empty-state">暂无播放列表，请先创建一个播放列表</div>';
    } else {
        list.innerHTML = playlistIds.map(id => {
            const playlist = playlistManager.playlists[id];
            return `
                <div class="playlist-selector-item" onclick="selectPlaylistForAdd('${id}')">
                    <div class="playlist-selector-info">
                        <div class="playlist-selector-name">${playlistManager.escapeHtml(playlist.name)}</div>
                        <div class="playlist-selector-count">${playlist.videos.length} 个视频</div>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        }).join('');
    }

    modal.style.display = 'flex';

    // 添加ESC键关闭模态框
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closePlaylistSelector();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closePlaylistSelector() {
    const modal = document.getElementById('playlistSelectorModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        console.log('Modal closed'); // 调试信息

        // 确保模态框完全隐藏
        setTimeout(() => {
            if (modal.style.display === 'none') {
                modal.style.visibility = 'visible';
            }
        }, 50);
    }
}

// 全局强制关闭函数，可以在控制台调用
window.forceCloseModal = function() {
    const modal = document.getElementById('playlistSelectorModal');
    if (modal) {
        modal.style.display = 'none !important';
        modal.style.visibility = 'hidden !important';
        modal.style.opacity = '0 !important';
        modal.style.pointerEvents = 'none !important';
        console.log('Modal force closed');
    }
};

// 简化的事件处理函数
function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closePlaylistSelector();
    }
}

function selectPlaylistForAdd(playlistId) {
    if (playlistManager) {
        playlistManager.addSelectedVideosToPlaylist(playlistId);
    }
    closePlaylistSelector();
}
