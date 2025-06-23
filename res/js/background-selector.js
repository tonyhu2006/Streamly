/**
 * Streamly 背景选择器
 * 管理主界面背景图片切换
 */

class BackgroundSelector {
    constructor() {
        this.backgrounds = [
            {
                id: 'default',
                name: '专业工作室',
                class: '',
                preview: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&auto=format&fit=crop&q=60',
                fullImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920&auto=format&fit=crop&q=80',
                description: '专业制作工作室氛围',
                author: 'John Matychuk',
                tags: ['工作室', '专业', '暖色调']
            },
            {
                id: 'studio',
                name: '暗色制作室',
                class: 'bg-studio',
                preview: 'https://images.unsplash.com/photo-1640957454144-392c8b05d5a5?w=400&auto=format&fit=crop&q=60',
                fullImage: 'https://images.unsplash.com/photo-1640957454144-392c8b05d5a5?w=1920&auto=format&fit=crop&q=80',
                description: '神秘暗色调制作环境',
                author: 'Damian Kamp',
                tags: ['暗色', '神秘', '专业']
            },
            {
                id: 'modern',
                name: '现代制作室',
                class: 'bg-modern',
                preview: 'https://images.unsplash.com/photo-1627407660893-fe01f60d44c4?w=400&auto=format&fit=crop&q=60',
                fullImage: 'https://images.unsplash.com/photo-1627407660893-fe01f60d44c4?w=1920&auto=format&fit=crop&q=80',
                description: '现代化视频制作环境',
                author: 'Luis Gherasim',
                tags: ['现代', '科技', '简洁']
            },
            {
                id: 'mixing',
                name: '控制台特写',
                class: 'bg-mixing',
                preview: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=400&auto=format&fit=crop&q=60',
                fullImage: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=1920&auto=format&fit=crop&q=80',
                description: '专业控制设备特写',
                author: 'Dylan McLeod',
                tags: ['控制台', '设备', '专业']
            },
            {
                id: 'gradient',
                name: '抽象渐变',
                class: 'bg-gradient',
                preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMGYwZjIzIiBzdG9wLW9wYWNpdHk9IjAuOTUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxYTFhMmUiIHN0b3Atb3BhY2l0eT0iMC45NSIvPjwvbGluZWFyR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJhIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNzg3N2M2IiBzdG9wLW9wYWNpdHk9IjAuMTUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9InRyYW5zcGFyZW50Ii8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNiZykiLz48Y2lyY2xlIGN4PSIzMCUiIGN5PSI3MCUiIHI9IjQwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==',
                fullImage: null,
                description: '深色抽象渐变背景，优化文字可读性',
                author: 'Streamly Team',
                tags: ['抽象', '渐变', '深色', '简洁']
            }
        ];
        
        this.currentBackground = this.loadSavedBackground();
        this.preloadedImages = new Set();
        this.transitionDuration = 800; // 背景切换动画时长
        this.init();
    }
    
    init() {
        this.createSelector();
        this.applyBackground(this.currentBackground);
        this.bindEvents();
        this.preloadBackgrounds();
        this.addAdvancedFeatures();
    }
    
    createSelector() {
        // 创建背景选择器按钮
        const selectorButton = document.createElement('button');
        selectorButton.id = 'backgroundSelectorBtn';
        selectorButton.innerHTML = '🎨';
        selectorButton.title = '更换背景';
        selectorButton.className = 'headerButton';
        selectorButton.style.cssText = `
            position: fixed;
            top: 15px;
            right: 20px;
            z-index: 1001;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        `;
        
        // 创建背景选择面板
        const selectorPanel = document.createElement('div');
        selectorPanel.id = 'backgroundSelectorPanel';
        selectorPanel.className = 'floatingMenu';
        selectorPanel.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            width: 320px;
            max-height: 500px;
            overflow-y: auto;
            z-index: 1002;
            display: none;
            padding: 20px;
        `;
        
        selectorPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #4fc3f7; margin: 0;">选择背景</h3>
                <button id="closeBgSelector" class="floatingMenuCloseButton">×</button>
            </div>
            <div id="backgroundGrid" style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                ${this.backgrounds.map(bg => this.createBackgroundOption(bg)).join('')}
            </div>
        `;
        
        document.body.appendChild(selectorButton);
        document.body.appendChild(selectorPanel);
    }
    
    createBackgroundOption(background) {
        const isActive = this.currentBackground === background.id;
        return `
            <div class="background-option ${isActive ? 'active' : ''}" data-bg-id="${background.id}">
                <div style="display: flex; gap: 15px; align-items: center; padding: 15px; border-radius: 10px; border: 2px solid ${isActive ? '#4fc3f7' : 'rgba(255,255,255,0.1)'}; background: rgba(255,255,255,0.05); cursor: pointer; transition: all 0.3s ease;">
                    <img src="${background.preview}" alt="${background.name}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                    <div style="flex: 1;">
                        <div style="color: #e0e0e0; font-weight: 500; margin-bottom: 5px;">${background.name}</div>
                        <div style="color: #b0bec5; font-size: 0.85em;">${background.description}</div>
                    </div>
                    ${isActive ? '<div style="color: #4fc3f7; font-size: 18px;">✓</div>' : ''}
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        const selectorButton = document.getElementById('backgroundSelectorBtn');
        const selectorPanel = document.getElementById('backgroundSelectorPanel');
        const closeButton = document.getElementById('closeBgSelector');
        
        // 打开/关闭面板
        selectorButton.addEventListener('click', () => {
            const isVisible = selectorPanel.style.display !== 'none';
            selectorPanel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                selectorPanel.style.animation = 'fadeInUp 0.3s ease-out';
            }
        });
        
        // 关闭面板
        closeButton.addEventListener('click', () => {
            selectorPanel.style.display = 'none';
        });
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!selectorButton.contains(e.target) && !selectorPanel.contains(e.target)) {
                selectorPanel.style.display = 'none';
            }
        });
        
        // 背景选择
        selectorPanel.addEventListener('click', (e) => {
            const option = e.target.closest('.background-option');
            if (option) {
                const bgId = option.dataset.bgId;
                this.selectBackground(bgId);
                selectorPanel.style.display = 'none';
            }
        });
    }
    
    selectBackground(backgroundId) {
        const oldBackground = this.currentBackground;
        this.currentBackground = backgroundId;

        // 添加切换动画类
        document.body.classList.add('background-changing');

        // 应用新背景
        this.applyBackground(backgroundId);
        this.saveBackground(backgroundId);
        this.updateUI();

        // 显示切换通知
        const background = this.backgrounds.find(bg => bg.id === backgroundId);
        if (background && oldBackground !== backgroundId) {
            this.showNotification(`✨ 背景已切换为: ${background.name}`, 'success');
        }

        // 移除动画类
        setTimeout(() => {
            document.body.classList.remove('background-changing');
        }, this.transitionDuration);
    }
    
    applyBackground(backgroundId) {
        const body = document.body;
        
        // 移除所有背景类
        this.backgrounds.forEach(bg => {
            if (bg.class) {
                body.classList.remove(bg.class);
            }
        });
        
        // 应用新背景类
        const background = this.backgrounds.find(bg => bg.id === backgroundId);
        if (background && background.class) {
            body.classList.add(background.class);
        }
    }
    
    updateUI() {
        const panel = document.getElementById('backgroundSelectorPanel');
        if (panel) {
            const grid = document.getElementById('backgroundGrid');
            grid.innerHTML = this.backgrounds.map(bg => this.createBackgroundOption(bg)).join('');
        }
    }
    
    saveBackground(backgroundId) {
        try {
            localStorage.setItem('streamly-background', backgroundId);
        } catch (e) {
            console.warn('无法保存背景设置:', e);
        }
    }
    
    loadSavedBackground() {
        try {
            return localStorage.getItem('streamly-background') || 'default';
        } catch (e) {
            console.warn('无法加载背景设置:', e);
            return 'default';
        }
    }

    /**
     * 预加载背景图片
     */
    preloadBackgrounds() {
        this.backgrounds.forEach(bg => {
            if (bg.fullImage && !this.preloadedImages.has(bg.id)) {
                const img = new Image();
                img.onload = () => {
                    this.preloadedImages.add(bg.id);
                    console.log(`背景图片预加载完成: ${bg.name}`);
                };
                img.onerror = () => {
                    console.warn(`背景图片预加载失败: ${bg.name}`);
                };
                img.src = bg.fullImage;
            }
        });
    }

    /**
     * 添加高级功能
     */
    addAdvancedFeatures() {
        // 添加键盘快捷键
        this.addKeyboardShortcuts();

        // 添加背景信息显示
        this.addBackgroundInfo();

        // 添加随机背景功能
        this.addRandomBackground();

        // 添加背景切换动画
        this.addTransitionEffects();
    }

    /**
     * 键盘快捷键
     */
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + B 打开背景选择器
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                const panel = document.getElementById('backgroundSelectorPanel');
                if (panel) {
                    const isVisible = panel.style.display !== 'none';
                    panel.style.display = isVisible ? 'none' : 'block';
                }
            }

            // Ctrl/Cmd + R 随机背景
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.selectRandomBackground();
            }
        });
    }

    /**
     * 添加背景信息显示
     */
    addBackgroundInfo() {
        const infoButton = document.createElement('button');
        infoButton.innerHTML = 'ℹ️';
        infoButton.title = '背景信息';
        infoButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(79, 195, 247, 0.1);
            border: 1px solid rgba(79, 195, 247, 0.3);
            color: #4fc3f7;
            cursor: pointer;
            z-index: 1001;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        infoButton.addEventListener('click', () => {
            this.showBackgroundInfo();
        });

        infoButton.addEventListener('mouseenter', () => {
            infoButton.style.background = 'rgba(79, 195, 247, 0.2)';
            infoButton.style.transform = 'scale(1.1)';
        });

        infoButton.addEventListener('mouseleave', () => {
            infoButton.style.background = 'rgba(79, 195, 247, 0.1)';
            infoButton.style.transform = 'scale(1)';
        });

        document.body.appendChild(infoButton);
    }

    /**
     * 显示当前背景信息
     */
    showBackgroundInfo() {
        const currentBg = this.backgrounds.find(bg => bg.id === this.currentBackground);
        if (!currentBg) return;

        const infoPanel = document.createElement('div');
        infoPanel.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            width: 300px;
            background: rgba(15, 15, 35, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(79, 195, 247, 0.3);
            border-radius: 15px;
            padding: 20px;
            color: #e0e0e0;
            z-index: 1002;
            animation: fadeInUp 0.3s ease-out;
        `;

        infoPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #4fc3f7; margin: 0;">当前背景</h4>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #ff5252; cursor: pointer; font-size: 18px;">×</button>
            </div>
            <div style="margin-bottom: 10px;">
                <strong style="color: #4fc3f7;">${currentBg.name}</strong>
            </div>
            <div style="color: #b0bec5; margin-bottom: 10px; font-size: 0.9em;">
                ${currentBg.description}
            </div>
            <div style="color: #888; font-size: 0.8em; margin-bottom: 10px;">
                摄影师: ${currentBg.author}
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                ${currentBg.tags.map(tag => `<span style="background: rgba(79, 195, 247, 0.2); color: #4fc3f7; padding: 2px 8px; border-radius: 10px; font-size: 0.7em;">${tag}</span>`).join('')}
            </div>
        `;

        document.body.appendChild(infoPanel);

        // 3秒后自动消失
        setTimeout(() => {
            if (document.body.contains(infoPanel)) {
                infoPanel.style.animation = 'fadeOut 0.3s ease-in';
                setTimeout(() => {
                    if (document.body.contains(infoPanel)) {
                        document.body.removeChild(infoPanel);
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * 添加随机背景功能
     */
    addRandomBackground() {
        const randomButton = document.createElement('button');
        randomButton.innerHTML = '🎲';
        randomButton.title = '随机背景 (Ctrl+R)';
        randomButton.style.cssText = `
            position: fixed;
            top: 15px;
            right: 70px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(79, 195, 247, 0.1);
            border: 1px solid rgba(79, 195, 247, 0.3);
            color: #4fc3f7;
            cursor: pointer;
            z-index: 1001;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        `;

        randomButton.addEventListener('click', () => {
            this.selectRandomBackground();
        });

        randomButton.addEventListener('mouseenter', () => {
            randomButton.style.background = 'rgba(79, 195, 247, 0.2)';
            randomButton.style.transform = 'scale(1.1) rotate(180deg)';
        });

        randomButton.addEventListener('mouseleave', () => {
            randomButton.style.background = 'rgba(79, 195, 247, 0.1)';
            randomButton.style.transform = 'scale(1) rotate(0deg)';
        });

        document.body.appendChild(randomButton);
    }

    /**
     * 选择随机背景
     */
    selectRandomBackground() {
        const availableBackgrounds = this.backgrounds.filter(bg => bg.id !== this.currentBackground);
        if (availableBackgrounds.length === 0) return;

        const randomBg = availableBackgrounds[Math.floor(Math.random() * availableBackgrounds.length)];
        this.selectBackground(randomBg.id);

        // 显示提示消息
        this.showNotification(`🎲 随机选择: ${randomBg.name}`, 'info');
    }

    /**
     * 添加背景切换动画效果
     */
    addTransitionEffects() {
        const style = document.createElement('style');
        style.textContent = `
            body::before {
                transition: all ${this.transitionDuration}ms ease-in-out !important;
            }

            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }

            @keyframes backgroundPulse {
                0%, 100% { opacity: 0.85; }
                50% { opacity: 0.9; }
            }

            .background-changing body::before {
                animation: backgroundPulse 1s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            info: '#2196f3',
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336'
        };

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
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

        // 添加滑动动画
        if (!document.querySelector('#notification-styles')) {
            const notificationStyles = document.createElement('style');
            notificationStyles.id = 'notification-styles';
            notificationStyles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(notificationStyles);
        }
    }
}

// 页面加载完成后初始化背景选择器
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他脚本已加载
    setTimeout(() => {
        window.backgroundSelector = new BackgroundSelector();
    }, 500);
});

// 导出供其他脚本使用
window.BackgroundSelector = BackgroundSelector;
