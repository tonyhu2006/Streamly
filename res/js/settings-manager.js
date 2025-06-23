/**
 * Streamly 设置管理器
 * 管理应用程序的各种设置和偏好
 */

class SettingsManager {
    constructor() {
        this.settings = {
            // 播放设置
            autoplayNext: true,
            defaultVolume: 80,
            playbackQuality: 'auto',
            
            // 界面设置
            darkMode: true,
            showThumbnails: true,
            
            // 搜索设置
            searchResultsCount: 20,
            safeSearch: 'moderate',
            
            // 播放列表设置
            shuffleMode: false,
            repeatMode: 'none',
            
            // 高级设置
            preloadVideos: true,
            keyboardShortcuts: true,
            analyticsEnabled: false
        };
        
        this.loadSettings();
        this.initializeUI();
    }
    
    /**
     * 从本地存储加载设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('streamly-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('无法加载设置:', e);
        }
    }
    
    /**
     * 保存设置到本地存储
     */
    saveSettings() {
        try {
            localStorage.setItem('streamly-settings', JSON.stringify(this.settings));
            this.showNotification('设置已保存', 'success');
        } catch (e) {
            console.error('无法保存设置:', e);
            this.showNotification('保存设置失败', 'error');
        }
    }
    
    /**
     * 初始化UI元素
     */
    initializeUI() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateUI());
        } else {
            this.updateUI();
        }
    }
    
    /**
     * 更新UI元素以反映当前设置
     */
    updateUI() {
        // 播放设置
        this.setCheckbox('autoplayNext', this.settings.autoplayNext);
        this.setRange('defaultVolume', this.settings.defaultVolume);
        this.setSelect('playbackQuality', this.settings.playbackQuality);
        
        // 界面设置
        this.setCheckbox('darkMode', this.settings.darkMode);
        this.setCheckbox('showThumbnails', this.settings.showThumbnails);
        
        // 搜索设置
        this.setSelect('searchResults', this.settings.searchResultsCount);
        this.setSelect('safeSearch', this.settings.safeSearch);
        
        // 播放列表设置
        this.setCheckbox('shuffleMode', this.settings.shuffleMode);
        this.setSelect('repeatMode', this.settings.repeatMode);
        
        // 高级设置
        this.setCheckbox('preloadVideos', this.settings.preloadVideos);
        this.setCheckbox('keyboardShortcuts', this.settings.keyboardShortcuts);
        this.setCheckbox('analyticsEnabled', this.settings.analyticsEnabled);
        
        // 更新音量显示
        this.updateVolumeDisplay();
        
        // 设置构建日期
        const buildDate = document.getElementById('buildDate');
        if (buildDate) {
            buildDate.textContent = new Date().toLocaleDateString('zh-CN');
        }
    }
    
    /**
     * 设置复选框状态
     */
    setCheckbox(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.checked = value;
        }
    }
    
    /**
     * 设置范围滑块值
     */
    setRange(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }
    
    /**
     * 设置选择框值
     */
    setSelect(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }
    
    /**
     * 更新音量显示
     */
    updateVolumeDisplay() {
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = `${this.settings.defaultVolume}%`;
        }
    }
    
    /**
     * 显示通知消息
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
    
    /**
     * 导出设置
     */
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'streamly-settings.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('设置已导出', 'success');
    }
    
    /**
     * 导入设置
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const imported = JSON.parse(e.target.result);
                        this.settings = { ...this.settings, ...imported };
                        this.saveSettings();
                        this.updateUI();
                        this.showNotification('设置已导入', 'success');
                    } catch (error) {
                        this.showNotification('导入失败：文件格式错误', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
    
    /**
     * 清除缓存
     */
    clearCache() {
        if (confirm('确定要清除所有缓存吗？这将删除临时数据但保留您的设置。')) {
            try {
                // 清除除设置外的所有本地存储
                const keysToKeep = ['streamly-settings', 'streamly-background', 'streamly-bg-settings'];
                const allKeys = Object.keys(localStorage);
                
                allKeys.forEach(key => {
                    if (!keysToKeep.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });
                
                this.showNotification('缓存已清除', 'success');
            } catch (e) {
                this.showNotification('清除缓存失败', 'error');
            }
        }
    }
    
    /**
     * 重置所有设置
     */
    resetSettings() {
        if (confirm('确定要重置所有设置吗？这将恢复到默认配置。')) {
            try {
                localStorage.removeItem('streamly-settings');
                this.settings = {
                    autoplayNext: true,
                    defaultVolume: 80,
                    playbackQuality: 'auto',
                    darkMode: true,
                    showThumbnails: true,
                    searchResultsCount: 20,
                    safeSearch: 'moderate',
                    shuffleMode: false,
                    repeatMode: 'none',
                    preloadVideos: true,
                    keyboardShortcuts: true,
                    analyticsEnabled: false
                };
                this.updateUI();
                this.showNotification('设置已重置', 'success');
            } catch (e) {
                this.showNotification('重置设置失败', 'error');
            }
        }
    }
}

// 全局设置管理器实例
let settingsManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager();
});

// 设置相关的全局函数
function toggleAutoplayNext() {
    if (settingsManager) {
        settingsManager.settings.autoplayNext = document.getElementById('autoplayNext').checked;
        settingsManager.saveSettings();
    }
}

function setDefaultVolume(value) {
    if (settingsManager) {
        settingsManager.settings.defaultVolume = parseInt(value);
        settingsManager.updateVolumeDisplay();
        settingsManager.saveSettings();
    }
}

function setPlaybackQuality(value) {
    if (settingsManager) {
        settingsManager.settings.playbackQuality = value;
        settingsManager.saveSettings();
    }
}

function toggleDarkMode() {
    if (settingsManager) {
        settingsManager.settings.darkMode = document.getElementById('darkMode').checked;
        settingsManager.saveSettings();
    }
}

function toggleThumbnails() {
    if (settingsManager) {
        settingsManager.settings.showThumbnails = document.getElementById('showThumbnails').checked;
        settingsManager.saveSettings();
    }
}

function setSearchResultsCount(value) {
    if (settingsManager) {
        settingsManager.settings.searchResultsCount = parseInt(value);
        settingsManager.saveSettings();
    }
}

function setSafeSearch(value) {
    if (settingsManager) {
        settingsManager.settings.safeSearch = value;
        settingsManager.saveSettings();
    }
}

function toggleShuffleMode() {
    if (settingsManager) {
        settingsManager.settings.shuffleMode = document.getElementById('shuffleMode').checked;
        settingsManager.saveSettings();
    }
}

function setRepeatMode(value) {
    if (settingsManager) {
        settingsManager.settings.repeatMode = value;
        settingsManager.saveSettings();
    }
}

function togglePreloadVideos() {
    if (settingsManager) {
        settingsManager.settings.preloadVideos = document.getElementById('preloadVideos').checked;
        settingsManager.saveSettings();
    }
}

function toggleKeyboardShortcuts() {
    if (settingsManager) {
        settingsManager.settings.keyboardShortcuts = document.getElementById('keyboardShortcuts').checked;
        settingsManager.saveSettings();
    }
}

function toggleAnalytics() {
    if (settingsManager) {
        settingsManager.settings.analyticsEnabled = document.getElementById('analyticsEnabled').checked;
        settingsManager.saveSettings();
    }
}

function exportSettings() {
    if (settingsManager) {
        settingsManager.exportSettings();
    }
}

function importSettings() {
    if (settingsManager) {
        settingsManager.importSettings();
    }
}

function clearCache() {
    if (settingsManager) {
        settingsManager.clearCache();
    }
}

function resetSettings() {
    if (settingsManager) {
        settingsManager.resetSettings();
    }
}
