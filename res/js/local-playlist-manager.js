/**
 * Streamly 本地播放列表管理器
 * 管理用户本地存储的播放列表，与临时播放队列分离
 */

class LocalPlaylistManager {
    constructor() {
        console.log('🔧 正在初始化本地播放列表管理器...');
        this.playlists = {};
        this.currentPlaylist = null; // 当前加载的播放列表
        this.isTemporaryQueue = true; // 当前是否为临时队列模式

        try {
            this.initializeLocalStorage();
            this.loadPlaylists();
            this.updatePlaylistSelector();
            console.log('✅ 本地播放列表管理器构造函数执行完成');
        } catch (e) {
            console.error('❌ 本地播放列表管理器构造函数执行失败:', e);
            throw e;
        }
    }
    
    /**
     * 初始化本地存储结构
     */
    initializeLocalStorage() {
        try {
            // 检查是否是首次使用
            const isFirstTime = !localStorage.getItem('streamly-local-playlists');
            
            if (isFirstTime) {
                // 创建默认的播放列表文件夹结构
                const defaultStructure = {
                    playlists: {},
                    folders: {
                        'favorites': {
                            name: '我的收藏',
                            description: '收藏的视频',
                            createdAt: new Date().toISOString()
                        },
                        'recent': {
                            name: '最近播放',
                            description: '最近播放的视频',
                            createdAt: new Date().toISOString()
                        }
                    },
                    settings: {
                        autoSaveTemp: true,
                        maxRecentItems: 50
                    }
                };
                
                localStorage.setItem('streamly-local-playlists', JSON.stringify(defaultStructure));
                console.log('✅ 已为用户创建本地播放列表文件夹');
            }
        } catch (e) {
            console.error('初始化本地存储失败:', e);
        }
    }
    
    /**
     * 加载本地播放列表
     */
    loadPlaylists() {
        try {
            const data = localStorage.getItem('streamly-local-playlists');
            if (data) {
                const parsed = JSON.parse(data);
                this.playlists = parsed.playlists || {};
                this.folders = parsed.folders || {};
                this.settings = parsed.settings || {};
            }
        } catch (e) {
            console.error('加载播放列表失败:', e);
            this.playlists = {};
            this.folders = {};
            this.settings = {};
        }
    }
    
    /**
     * 保存播放列表到本地存储
     */
    savePlaylists() {
        try {
            const data = {
                playlists: this.playlists,
                folders: this.folders,
                settings: this.settings,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('streamly-local-playlists', JSON.stringify(data));
        } catch (e) {
            console.error('保存播放列表失败:', e);
        }
    }
    
    /**
     * 创建新播放列表
     */
    createPlaylist(name, description = '', folder = null) {
        if (!name || name.trim() === '') {
            this.showNotification('请输入播放列表名称', 'warning');
            return false;
        }
        
        const playlistId = this.generateId();
        const playlist = {
            id: playlistId,
            name: name.trim(),
            description: description.trim(),
            folder: folder,
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            playCount: 0,
            totalDuration: 0
        };
        
        this.playlists[playlistId] = playlist;
        this.savePlaylists();
        this.updatePlaylistSelector();
        this.showNotification(`播放列表 "${name}" 创建成功`, 'success');
        
        return playlistId;
    }
    
    /**
     * 删除播放列表
     */
    deletePlaylist(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return false;
        
        if (confirm(`确定要删除播放列表 "${playlist.name}" 吗？此操作无法撤销。`)) {
            delete this.playlists[playlistId];
            this.savePlaylists();
            this.updatePlaylistSelector();
            
            // 如果删除的是当前播放列表，切换到临时队列
            if (this.currentPlaylist === playlistId) {
                this.switchToTemporaryQueue();
            }
            
            this.showNotification(`播放列表 "${playlist.name}" 已删除`, 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * 加载播放列表到主界面
     */
    loadPlaylistToMain(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) {
            this.showNotification('播放列表不存在', 'error');
            return false;
        }

        // 清空当前临时队列
        this.clearTemporaryQueue();

        // 加载播放列表视频到主界面
        playlist.videos.forEach((video, index) => {
            // 使用全局的addVideo函数来正确添加视频
            if (typeof window.addVideo === 'function') {
                window.addVideo(video.title, video.duration, video.id);
            } else {
                // 降级方案：直接操作数组和界面
                this.addVideoToMainQueue(video, index);
            }
        });

        // 更新当前播放列表状态
        this.currentPlaylist = playlistId;
        this.isTemporaryQueue = false;

        // 更新播放列表选择器
        this.updatePlaylistSelector();

        // 更新播放次数
        playlist.playCount = (playlist.playCount || 0) + 1;
        playlist.lastPlayedAt = new Date().toISOString();
        this.savePlaylists();

        this.showNotification(`已加载播放列表 "${playlist.name}" (${playlist.videos.length} 个视频)`, 'success');
        return true;
    }
    
    /**
     * 切换到临时播放队列模式
     */
    switchToTemporaryQueue() {
        this.currentPlaylist = null;
        this.isTemporaryQueue = true;
        this.updatePlaylistSelector();
        this.showNotification('已切换到临时播放队列', 'info');
    }
    
    /**
     * 保存当前临时队列为播放列表
     */
    saveTemporaryQueueAsPlaylist(name, description = '') {
        const videos = this.getCurrentQueueVideos();
        
        if (videos.length === 0) {
            this.showNotification('临时队列为空，无法保存', 'warning');
            return false;
        }
        
        const playlistId = this.createPlaylist(name, description);
        if (playlistId) {
            const playlist = this.playlists[playlistId];
            playlist.videos = videos;
            playlist.totalDuration = this.calculateTotalDuration(videos);
            this.savePlaylists();
            
            this.showNotification(`临时队列已保存为播放列表 "${name}"`, 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * 更新播放列表选择器
     */
    updatePlaylistSelector() {
        const selector = document.getElementById('currentPlaylistSelect');
        if (!selector) return;
        
        // 清空现有选项
        selector.innerHTML = '';
        
        // 添加临时队列选项
        const tempOption = document.createElement('option');
        tempOption.value = 'temp';
        tempOption.textContent = '📝 临时播放队列';
        tempOption.selected = this.isTemporaryQueue;
        selector.appendChild(tempOption);
        
        // 添加分隔线
        if (Object.keys(this.playlists).length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────────';
            selector.appendChild(separator);
        }
        
        // 添加本地播放列表
        Object.values(this.playlists).forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = `📋 ${playlist.name} (${playlist.videos.length})`;
            option.selected = this.currentPlaylist === playlist.id;
            selector.appendChild(option);
        });
    }
    
    /**
     * 获取当前队列中的视频
     */
    getCurrentQueueVideos() {
        const videos = [];
        
        // 从全局videos数组获取当前队列视频
        if (typeof window.videos !== 'undefined' && window.videos) {
            window.videos.forEach((video, index) => {
                if (video && video.length >= 3) {
                    videos.push({
                        id: video[2], // YouTube ID
                        title: video[0], // 标题
                        duration: video[1], // 时长（秒）
                        thumbnail: `https://i.ytimg.com/vi/${video[2]}/default.jpg`,
                        addedAt: new Date().toISOString()
                    });
                }
            });
        }
        
        return videos;
    }
    
    /**
     * 清空临时队列
     */
    clearTemporaryQueue() {
        // 清空全局videos数组
        if (typeof window.videos !== 'undefined') {
            window.videos = [];
        }
        
        // 清空主界面表格
        const table = document.getElementById('videosTable');
        if (table) {
            table.innerHTML = '';
        }
        
        // 重置播放器状态
        if (typeof window.resetPlayer === 'function') {
            window.resetPlayer();
        }
    }
    
    /**
     * 添加视频到主队列
     */
    addVideoToMainQueue(video, index) {
        // 确保全局videos数组存在
        if (typeof window.videos === 'undefined') {
            window.videos = [];
        }

        // 添加到全局数组
        window.videos.push([
            video.title,
            video.duration,
            video.id
        ]);

        // 更新主界面显示 - 使用正确的函数名
        if (typeof addVideoToList === 'function') {
            const timeString = this.formatDurationToString(video.duration);
            addVideoToList(video.title, timeString, window.videos.length, false);
        } else {
            console.warn('addVideoToList函数不可用');
        }
    }

    /**
     * 将秒数转换为时间字符串
     */
    formatDurationToString(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * 计算总时长
     */
    calculateTotalDuration(videos) {
        return videos.reduce((total, video) => {
            return total + (parseInt(video.duration) || 0);
        }, 0);
    }
    
    /**
     * 生成唯一ID
     */
    generateId() {
        return 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

// 全局实例
let localPlaylistManager;

// 确保类在全局作用域中可用
window.LocalPlaylistManager = LocalPlaylistManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    try {
        localPlaylistManager = new LocalPlaylistManager();
        window.localPlaylistManager = localPlaylistManager;
        console.log('✅ 本地播放列表管理器初始化成功');
    } catch (e) {
        console.error('❌ 本地播放列表管理器初始化失败:', e);
    }
});

// 立即尝试初始化（如果DOM已经加载）
if (document.readyState === 'loading') {
    // DOM还在加载中，等待DOMContentLoaded事件
} else {
    // DOM已经加载完成，立即初始化
    try {
        if (!localPlaylistManager) {
            localPlaylistManager = new LocalPlaylistManager();
            window.localPlaylistManager = localPlaylistManager;
            console.log('✅ 本地播放列表管理器立即初始化成功');
        }
    } catch (e) {
        console.error('❌ 本地播放列表管理器立即初始化失败:', e);
    }
}

// 全局函数供HTML调用
function switchPlaylist(value) {
    if (!localPlaylistManager) return;
    
    if (value === 'temp') {
        localPlaylistManager.switchToTemporaryQueue();
    } else {
        localPlaylistManager.loadPlaylistToMain(value);
    }
}

function showCreatePlaylistDialog() {
    const modal = document.getElementById('quickCreatePlaylistModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeQuickCreateDialog() {
    const modal = document.getElementById('quickCreatePlaylistModal');
    if (modal) {
        modal.style.display = 'none';
        
        // 清空输入框
        const nameInput = document.getElementById('quickPlaylistName');
        const descInput = document.getElementById('quickPlaylistDescription');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
    }
}

function createQuickPlaylist() {
    const nameInput = document.getElementById('quickPlaylistName');
    const descInput = document.getElementById('quickPlaylistDescription');
    
    if (nameInput && localPlaylistManager) {
        const name = nameInput.value.trim();
        const description = descInput ? descInput.value.trim() : '';
        
        if (localPlaylistManager.createPlaylist(name, description)) {
            closeQuickCreateDialog();
        }
    }
}

function saveCurrentQueueAsPlaylist() {
    if (!localPlaylistManager) return;

    const name = prompt('请输入播放列表名称:');
    if (name && name.trim()) {
        const description = prompt('请输入描述（可选）:') || '';
        localPlaylistManager.saveTemporaryQueueAsPlaylist(name.trim(), description.trim());
    }
}

/**
 * 显示本地播放列表选择器（用于单个视频添加）
 */
function showLocalPlaylistSelector(video) {
    const modal = document.getElementById('localPlaylistSelectorModal');
    if (!modal) {
        createLocalPlaylistSelectorModal();
    }

    const list = document.getElementById('localPlaylistSelectorList');
    const modalElement = document.getElementById('localPlaylistSelectorModal');

    if (!list || !modalElement || !localPlaylistManager) return;

    const playlists = Object.values(localPlaylistManager.playlists);

    list.innerHTML = playlists.map(playlist => {
        return `
            <div class="local-playlist-selector-item" onclick="addVideoToLocalPlaylist('${playlist.id}', '${video.id}', '${escapeForAttribute(video.title)}', ${video.duration}, '${escapeForAttribute(video.thumbnail)}')">
                <div class="local-playlist-selector-info">
                    <div class="local-playlist-selector-name">${escapeHtml(playlist.name)}</div>
                    <div class="local-playlist-selector-count">${playlist.videos.length} 个视频</div>
                    ${playlist.description ? `<div class="local-playlist-selector-desc">${escapeHtml(playlist.description)}</div>` : ''}
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    }).join('');

    // 存储当前视频信息
    modalElement.dataset.currentVideo = JSON.stringify(video);

    modalElement.style.display = 'flex';
}

/**
 * 关闭本地播放列表选择器
 */
function closeLocalPlaylistSelector() {
    const modal = document.getElementById('localPlaylistSelectorModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 添加视频到本地播放列表
 */
function addVideoToLocalPlaylist(playlistId, videoId, videoTitle, videoDuration, videoThumbnail) {
    if (!localPlaylistManager) return;

    const playlist = localPlaylistManager.playlists[playlistId];
    if (!playlist) {
        localPlaylistManager.showNotification('播放列表不存在', 'error');
        return;
    }

    // 检查视频是否已存在
    const exists = playlist.videos.some(v => v.id === videoId);
    if (exists) {
        localPlaylistManager.showNotification(`视频已在播放列表 "${playlist.name}" 中`, 'warning');
        closeLocalPlaylistSelector();
        return;
    }

    // 添加视频
    const video = {
        id: videoId,
        title: decodeURIComponent(videoTitle),
        duration: videoDuration,
        thumbnail: videoThumbnail,
        addedAt: new Date().toISOString()
    };

    playlist.videos.push(video);
    playlist.updatedAt = new Date().toISOString();
    playlist.totalDuration = localPlaylistManager.calculateTotalDuration(playlist.videos);

    localPlaylistManager.savePlaylists();
    localPlaylistManager.updatePlaylistSelector();

    localPlaylistManager.showNotification(`视频已添加到播放列表 "${playlist.name}"`, 'success');
    closeLocalPlaylistSelector();
}

/**
 * 为单个视频创建播放列表
 */
function showCreatePlaylistForVideo(video) {
    const modal = document.getElementById('createPlaylistForVideoModal');
    if (!modal) {
        createPlaylistForVideoModal();
    }

    const modalElement = document.getElementById('createPlaylistForVideoModal');
    if (modalElement) {
        // 存储视频信息
        modalElement.dataset.currentVideo = JSON.stringify(video);
        modalElement.style.display = 'flex';

        // 清空输入框
        const nameInput = document.getElementById('videoPlaylistName');
        const descInput = document.getElementById('videoPlaylistDescription');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
    }
}

/**
 * 关闭为视频创建播放列表的对话框
 */
function closeCreatePlaylistForVideo() {
    const modal = document.getElementById('createPlaylistForVideoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 创建播放列表并添加视频
 */
function createPlaylistAndAddVideo() {
    const nameInput = document.getElementById('videoPlaylistName');
    const descInput = document.getElementById('videoPlaylistDescription');
    const modal = document.getElementById('createPlaylistForVideoModal');

    if (!nameInput || !modal || !localPlaylistManager) return;

    const name = nameInput.value.trim();
    const description = descInput ? descInput.value.trim() : '';

    if (!name) {
        localPlaylistManager.showNotification('请输入播放列表名称', 'warning');
        return;
    }

    // 获取视频信息
    const videoData = JSON.parse(modal.dataset.currentVideo || '{}');

    // 创建播放列表
    const playlistId = localPlaylistManager.createPlaylist(name, description);
    if (playlistId) {
        // 添加视频到新创建的播放列表
        const playlist = localPlaylistManager.playlists[playlistId];
        playlist.videos.push({
            id: videoData.id,
            title: videoData.title,
            duration: videoData.duration,
            thumbnail: videoData.thumbnail,
            addedAt: new Date().toISOString()
        });

        playlist.totalDuration = localPlaylistManager.calculateTotalDuration(playlist.videos);
        localPlaylistManager.savePlaylists();
        localPlaylistManager.updatePlaylistSelector();

        localPlaylistManager.showNotification(`播放列表 "${name}" 创建成功，视频已添加`, 'success');
        closeCreatePlaylistForVideo();
    }
}

/**
 * HTML转义（用于属性）
 */
function escapeForAttribute(text) {
    return encodeURIComponent(text);
}

/**
 * HTML转义（用于显示）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 创建本地播放列表选择器模态框
 */
function createLocalPlaylistSelectorModal() {
    const modalHTML = `
        <div id="localPlaylistSelectorModal" class="modal" style="display: none;" onclick="if(event.target === this) { closeLocalPlaylistSelector(); }">
            <div class="modal-content" onclick="event.stopPropagation();">
                <div class="modal-header">
                    <h3>选择播放列表</h3>
                    <button class="modal-close" onclick="closeLocalPlaylistSelector();">×</button>
                </div>
                <div class="modal-body">
                    <div id="localPlaylistSelectorList" class="local-playlist-selector-list">
                        <!-- 播放列表选项将在这里生成 -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-button" onclick="showCreatePlaylistForVideoFromSelector();">
                        <i class="fas fa-plus"></i> 创建新播放列表
                    </button>
                    <button class="action-button secondary" onclick="closeLocalPlaylistSelector();">取消</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * 创建为视频创建播放列表的模态框
 */
function createPlaylistForVideoModal() {
    const modalHTML = `
        <div id="createPlaylistForVideoModal" class="modal" style="display: none;" onclick="if(event.target === this) { closeCreatePlaylistForVideo(); }">
            <div class="modal-content" onclick="event.stopPropagation();">
                <div class="modal-header">
                    <h3>创建播放列表</h3>
                    <button class="modal-close" onclick="closeCreatePlaylistForVideo();">×</button>
                </div>
                <div class="modal-body">
                    <div class="quick-create-form">
                        <input type="text" id="videoPlaylistName" placeholder="播放列表名称..." maxlength="50">
                        <textarea id="videoPlaylistDescription" placeholder="描述（可选）..." rows="2" maxlength="200"></textarea>
                        <div class="create-info">
                            <i class="fas fa-info-circle"></i>
                            <span>创建后将自动添加当前视频到播放列表中</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-button" onclick="createPlaylistAndAddVideo();">
                        <i class="fas fa-plus"></i> 创建并添加
                    </button>
                    <button class="action-button secondary" onclick="closeCreatePlaylistForVideo();">取消</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * 从选择器中显示创建播放列表对话框
 */
function showCreatePlaylistForVideoFromSelector() {
    const selectorModal = document.getElementById('localPlaylistSelectorModal');
    const video = selectorModal ? JSON.parse(selectorModal.dataset.currentVideo || '{}') : {};

    closeLocalPlaylistSelector();
    showCreatePlaylistForVideo(video);
}

// 全局调试函数
window.checkPlaylistManager = function() {
    console.log('=== 播放列表管理器状态检查 ===');
    console.log('window.localPlaylistManager:', window.localPlaylistManager);
    console.log('localPlaylistManager:', typeof localPlaylistManager !== 'undefined' ? localPlaylistManager : 'undefined');
    console.log('LocalPlaylistManager class:', typeof LocalPlaylistManager !== 'undefined' ? 'available' : 'undefined');

    if (window.localPlaylistManager) {
        console.log('playlists:', window.localPlaylistManager.playlists);
        console.log('playlists count:', Object.keys(window.localPlaylistManager.playlists).length);
    }

    return {
        hasManager: !!window.localPlaylistManager,
        hasClass: typeof LocalPlaylistManager !== 'undefined',
        playlistCount: window.localPlaylistManager ? Object.keys(window.localPlaylistManager.playlists).length : 0
    };
};

// 强制初始化函数
window.forceInitPlaylistManager = function() {
    try {
        if (!window.localPlaylistManager) {
            console.log('🔧 强制初始化本地播放列表管理器...');
            window.localPlaylistManager = new LocalPlaylistManager();
            localPlaylistManager = window.localPlaylistManager;
            console.log('✅ 强制初始化成功');
        } else {
            console.log('ℹ️ 管理器已存在，无需初始化');
        }
        return window.checkPlaylistManager();
    } catch (e) {
        console.error('❌ 强制初始化失败:', e);
        return { error: e.message };
    }
};

// 测试播放列表功能
window.testPlaylistFeatures = function() {
    console.log('=== 播放列表功能测试 ===');

    if (!window.localPlaylistManager) {
        console.log('❌ 本地播放列表管理器未初始化');
        return;
    }

    const manager = window.localPlaylistManager;
    console.log('✅ 管理器已初始化');
    console.log('📋 播放列表数量:', Object.keys(manager.playlists).length);

    // 列出所有播放列表
    Object.values(manager.playlists).forEach(playlist => {
        console.log(`📁 播放列表: ${playlist.name} (${playlist.videos.length} 个视频)`);
        playlist.videos.forEach((video, index) => {
            console.log(`  ${index + 1}. ${video.title} (${video.id})`);
        });
    });

    // 测试函数可用性
    console.log('🔧 函数可用性检查:');
    console.log('  addVideo:', typeof window.addVideo);
    console.log('  addVideoToList:', typeof window.addVideoToList);
    console.log('  videos数组:', typeof window.videos, window.videos ? window.videos.length : 'undefined');
};
