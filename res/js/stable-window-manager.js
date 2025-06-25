/**
 * Streamly 稳定窗口管理器
 * 为弹出窗口添加拖拽和缩放功能，保持原有结构不变
 */

class StableWindowManager {
    constructor() {
        this.activeWindow = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.minWidth = 300;
        this.minHeight = 200;
        this.originalStyles = new Map();
        this.headerHeight = 0; // 缓存Header高度
        this.touchStartInfo = null; // 触摸起始信息

        this.init();
    }
    
    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupWindows());
        } else {
            this.setupWindows();
        }
        
        // 全局事件监听
        this.setupGlobalEvents();
    }
    
    setupGlobalEvents() {
        // 鼠标事件
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());

        // 触摸事件（移动端）
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', () => this.handleTouchEnd());
        document.addEventListener('touchcancel', () => this.handleTouchEnd());

        // 防止拖拽时选择文本
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging || this.isResizing) {
                e.preventDefault();
            }
        });


    }
    
    setupWindows() {
        // 为现有窗口添加功能
        this.enhanceExistingWindows();
        
        // 监听新窗口
        this.observeNewWindows();
    }
    
    enhanceExistingWindows() {
        // 查找所有浮动窗口
        const floatingMenus = document.querySelectorAll('.floatingMenu');
        const modals = document.querySelectorAll('.modal-content');

        floatingMenus.forEach(window => this.enhanceWindow(window));
        modals.forEach(window => {
            // 只增强可见的模态框
            const modal = window.closest('.modal');
            if (modal && modal.style.display !== 'none') {
                this.enhanceWindow(window);
            }
        });
    }
    
    enhanceWindow(windowElement) {
        // 避免重复增强
        if (windowElement.dataset.enhanced === 'true') {
            return;
        }

        // 排除特定的模态框，不进行拖拽缩放增强
        const excludeIds = [
            'quickCreatePlaylistModal',
            'localPlaylistSelectorModal',
            'createPlaylistForVideoModal',
            'playlistSelectorModal'
        ];

        // 检查是否是被排除的模态框
        const modal = windowElement.closest('.modal');
        if (modal && excludeIds.includes(modal.id)) {
            console.log('跳过增强模态框:', modal.id);
            return;
        }

        // 检查窗口本身是否在排除列表中
        if (excludeIds.includes(windowElement.id)) {
            console.log('跳过增强窗口:', windowElement.id);
            return;
        }

        windowElement.dataset.enhanced = 'true';

        // 保存原始样式
        this.saveOriginalStyles(windowElement);

        // 设置基本样式
        this.setupBasicStyles(windowElement);

        // 添加拖拽区域
        this.addDragArea(windowElement);

        // 添加缩放手柄
        this.addResizeHandles(windowElement);

        // 添加窗口控制
        this.addWindowControls(windowElement);
    }
    
    saveOriginalStyles(windowElement) {
        const styles = {
            position: windowElement.style.position,
            left: windowElement.style.left,
            top: windowElement.style.top,
            width: windowElement.style.width,
            height: windowElement.style.height,
            zIndex: windowElement.style.zIndex
        };
        this.originalStyles.set(windowElement, styles);
    }
    
    setupBasicStyles(windowElement) {
        console.log('🔧 setupBasicStyles 被调用');

        // 记录当前窗口状态
        const rect = windowElement.getBoundingClientRect();
        console.log(`🔧 窗口当前位置: (${rect.left}, ${rect.top})`);
        console.log(`🔧 窗口当前样式: position=${windowElement.style.position}, left=${windowElement.style.left}, top=${windowElement.style.top}`);

        // 设置基本样式
        if (!windowElement.style.position || windowElement.style.position === 'static') {
            windowElement.style.position = 'fixed';
        }

        if (!windowElement.style.zIndex) {
            windowElement.style.zIndex = '1000';
        }

        // 设置最小尺寸
        windowElement.style.minWidth = this.minWidth + 'px';
        windowElement.style.minHeight = this.minHeight + 'px';

        // 如果没有设置位置，或者位置为默认值，则居中显示
        const hasValidPosition = windowElement.style.left &&
                                windowElement.style.top &&
                                windowElement.style.left !== '' &&
                                windowElement.style.top !== '' &&
                                windowElement.style.left !== 'auto' &&
                                windowElement.style.top !== 'auto';

        if (!hasValidPosition) {
            console.log('🔧 窗口没有有效位置，执行居中');
            this.centerWindow(windowElement);
        } else {
            console.log('🔧 窗口已有有效位置，跳过居中');
        }
    }
    
    centerWindow(windowElement) {
        const rect = windowElement.getBoundingClientRect();
        const headerHeight = this.getHeaderHeight();
        const footerHeight = this.getFooterHeight();

        // 计算Header和Footer之间的可用区域
        const availableHeight = window.innerHeight - headerHeight - footerHeight;
        const availableWidth = window.innerWidth;

        // 在可用区域中居中
        const centerX = (availableWidth - rect.width) / 2;
        const centerY = headerHeight + (availableHeight - rect.height) / 2;

        // 确保窗口不会超出边界
        const constrainedX = Math.max(0, Math.min(centerX, availableWidth - rect.width));
        const constrainedY = Math.max(headerHeight, Math.min(centerY, headerHeight + availableHeight - rect.height));

        windowElement.style.left = constrainedX + 'px';
        windowElement.style.top = constrainedY + 'px';

        console.log(`🎯 窗口居中: Header高度=${headerHeight}, Footer高度=${footerHeight}`);
        console.log(`🎯 可用区域: 宽度=${availableWidth}, 高度=${availableHeight}`);
        console.log(`🎯 窗口尺寸: 宽度=${rect.width}, 高度=${rect.height}`);
        console.log(`🎯 居中位置: (${constrainedX}, ${constrainedY})`);
    }
    
    addDragArea(windowElement) {
        // 查找现有的标题区域
        let dragArea = windowElement.querySelector('h2, .modal-header');
        
        if (!dragArea) {
            // 创建拖拽区域
            dragArea = document.createElement('div');
            dragArea.className = 'window-drag-area';
            dragArea.innerHTML = '<i class="fas fa-grip-horizontal"></i> 拖拽区域';
            windowElement.insertBefore(dragArea, windowElement.firstChild);
        }
        
        // 添加拖拽样式和事件
        dragArea.style.cursor = 'move';
        dragArea.style.userSelect = 'none';
        dragArea.style.padding = '8px';
        dragArea.style.background = 'rgba(79, 195, 247, 0.1)';
        dragArea.style.borderBottom = '1px solid rgba(79, 195, 247, 0.3)';
        dragArea.style.transition = 'all 0.2s ease';

        // 增强鼠标悬停效果
        dragArea.addEventListener('mouseenter', () => {
            dragArea.style.background = 'rgba(79, 195, 247, 0.15)';
            dragArea.style.cursor = 'move';
        });

        dragArea.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                dragArea.style.background = 'rgba(79, 195, 247, 0.1)';
            }
        });

        // 鼠标事件
        dragArea.addEventListener('mousedown', (e) => this.startDrag(e, windowElement));

        // 触摸事件（移动端）
        dragArea.addEventListener('touchstart', (e) => this.startTouchDrag(e, windowElement), { passive: false });
    }
    
    addResizeHandles(windowElement) {
        // 创建缩放手柄
        const handles = [
            { class: 'resize-se', cursor: 'se-resize', style: 'bottom: 0; right: 0; width: 15px; height: 15px;' },
            { class: 'resize-s', cursor: 's-resize', style: 'bottom: 0; left: 15px; right: 15px; height: 5px;' },
            { class: 'resize-e', cursor: 'e-resize', style: 'top: 15px; bottom: 15px; right: 0; width: 5px;' }
        ];
        
        handles.forEach(handle => {
            const handleElement = document.createElement('div');
            handleElement.className = `resize-handle ${handle.class}`;
            handleElement.style.cssText = `
                position: absolute;
                background: transparent;
                cursor: ${handle.cursor};
                z-index: 10;
                ${handle.style}
            `;
            
            handleElement.addEventListener('mousedown', (e) => {
                this.startResize(e, windowElement, handle.class.replace('resize-', ''));
            });
            
            windowElement.appendChild(handleElement);
        });
    }
    
    addWindowControls(windowElement) {
        // 查找现有的关闭按钮
        let closeBtn = windowElement.querySelector('.floatingMenuCloseButton, .modal-close');
        
        if (closeBtn) {
            // 增强现有关闭按钮
            closeBtn.style.background = 'rgba(244, 67, 54, 0.2)';
            closeBtn.style.color = '#f44336';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.padding = '4px 8px';
            closeBtn.style.transition = 'all 0.3s ease';
            
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = 'rgba(244, 67, 54, 0.3)';
                closeBtn.style.transform = 'scale(1.1)';
            });
            
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = 'rgba(244, 67, 54, 0.2)';
                closeBtn.style.transform = 'scale(1)';
            });
        }
    }
    
    startDrag(e, windowElement) {
        // 避免在控制按钮上开始拖拽
        if (e.target.closest('.floatingMenuCloseButton, .modal-close, .window-controls')) {
            return;
        }

        this.isDragging = true;
        this.activeWindow = windowElement;

        const rect = windowElement.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;

        // 获取Header高度，用于后续边界检查
        this.headerHeight = this.getHeaderHeight();

        // 不要在拖拽开始时立即修正位置，这会导致窗口跳跃
        // 边界检查将在拖拽过程中进行

        // 添加拖拽状态样式
        windowElement.style.zIndex = '10001';
        windowElement.classList.add('being-dragged');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'move';
        document.body.classList.add('window-dragging');

        e.preventDefault();
    }

    startTouchDrag(e, windowElement) {
        // 避免在控制按钮上开始拖拽
        if (e.target.closest('.floatingMenuCloseButton, .modal-close, .window-controls')) {
            return;
        }

        // 获取第一个触摸点
        const touch = e.touches[0];
        if (!touch) return;

        console.log('📱 触摸开始 - 稳定的垂直拖拽模式');

        // 记录触摸开始前的窗口位置（使用计算样式，更稳定）
        const computedStyle = window.getComputedStyle(windowElement);
        const currentLeft = parseFloat(computedStyle.left) || 0;
        const currentTop = parseFloat(computedStyle.top) || 0;

        // 记录触摸信息，但绝对不修改任何窗口属性
        this.touchStartInfo = {
            startX: touch.clientX,
            startY: touch.clientY,
            windowElement: windowElement,
            initialWindowTop: currentTop,
            initialWindowLeft: currentLeft,
            hasMoved: false,
            isDragging: false
        };

        console.log(`📱 记录触摸起始点: (${touch.clientX}, ${touch.clientY})`);
        console.log(`📱 窗口稳定位置: left=${currentLeft}, top=${currentTop}`);

        // 只阻止默认行为，绝对不做任何其他操作
        e.preventDefault();
        e.stopPropagation(); // 防止事件冒泡
    }


    
    startResize(e, windowElement, direction) {
        this.isResizing = true;
        this.activeWindow = windowElement;
        this.resizeHandle = direction;
        
        windowElement.style.zIndex = '10001';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleMouseMove(e) {
        if (this.isDragging && this.activeWindow) {
            this.dragWindow(e);
        } else if (this.isResizing && this.activeWindow) {
            this.resizeWindow(e);
        }
    }

    handleTouchMove(e) {
        const touch = e.touches[0];
        if (!touch) return;

        // 如果已经在拖拽中，继续垂直拖拽
        if (this.touchStartInfo && this.touchStartInfo.isDragging) {
            this.handleStableVerticalDrag(touch);
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // 如果有触摸起始信息，检查是否应该开始拖拽
        if (this.touchStartInfo && !this.touchStartInfo.hasMoved) {
            const deltaX = touch.clientX - this.touchStartInfo.startX;
            const deltaY = touch.clientY - this.touchStartInfo.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // 只有当垂直移动距离超过阈值时才激活拖拽
            if (Math.abs(deltaY) > 15) { // 增加阈值，只响应明显的垂直移动
                console.log(`📱 检测到垂直移动距离 ${Math.abs(deltaY)}px，激活垂直拖拽`);

                this.touchStartInfo.hasMoved = true;
                this.touchStartInfo.isDragging = true;

                // 激活拖拽状态，但不修改窗口位置
                this.isDragging = true;
                this.activeWindow = this.touchStartInfo.windowElement;

                // 获取Header高度
                this.headerHeight = this.getHeaderHeight();

                // 添加拖拽状态样式（但不修改位置）
                this.activeWindow.style.zIndex = '10001';
                this.activeWindow.classList.add('being-dragged');
                document.body.style.userSelect = 'none';
                document.body.classList.add('window-dragging');

                // 添加触摸反馈
                const dragArea = this.activeWindow.querySelector('h2, .modal-header, .window-drag-area');
                if (dragArea) {
                    dragArea.style.background = 'rgba(79, 195, 247, 0.2)';
                }

                // 开始处理垂直拖拽
                this.handleStableVerticalDrag(touch);
            }

            e.preventDefault();
            e.stopPropagation();
        }
    }

    handleStableVerticalDrag(touch) {
        if (!this.touchStartInfo || !this.activeWindow) return;

        // 计算垂直移动距离
        const deltaY = touch.clientY - this.touchStartInfo.startY;

        // 计算新的垂直位置（保持水平位置绝对不变）
        const newTop = this.touchStartInfo.initialWindowTop + deltaY;
        const fixedLeft = this.touchStartInfo.initialWindowLeft; // 绝对固定的水平位置

        console.log(`📱 稳定垂直拖拽: 起始Y=${this.touchStartInfo.startY}, 当前Y=${touch.clientY}, 移动距离=${deltaY}`);
        console.log(`📱 新位置: left=${fixedLeft}(固定不变), top=${newTop}`);

        // 改进的垂直边界限制：确保标题栏始终可见
        const headerHeight = this.headerHeight || this.getHeaderHeight();
        const footerHeight = this.getFooterHeight();
        const titleBarHeight = 50; // 标题栏高度（确保标题栏可见）

        const minY = headerHeight; // 不能超出Header上方
        const maxY = window.innerHeight - footerHeight - titleBarHeight; // 确保标题栏不被footer遮挡

        const constrainedTop = Math.max(minY, Math.min(newTop, maxY));

        console.log(`📱 垂直边界: headerHeight=${headerHeight}, footerHeight=${footerHeight}`);
        console.log(`📱 边界限制: minY=${minY}, maxY=${maxY}, 限制后top=${constrainedTop}`);

        // 使用transform而不是直接修改left/top，避免触发重新布局
        this.activeWindow.style.transform = `translate(${fixedLeft}px, ${constrainedTop}px)`;
        this.activeWindow.style.left = '0px'; // 重置left
        this.activeWindow.style.top = '0px';  // 重置top

        console.log(`📱 使用transform设置位置: translate(${fixedLeft}px, ${constrainedTop}px)`);
    }
    
    getHeaderHeight() {
        const header = document.querySelector('header');
        if (header && header.style.display !== 'none') {
            return header.offsetHeight;
        }
        return 0; // 如果header不存在或隐藏，返回0
    }

    getFooterHeight() {
        const footer = document.querySelector('footer');
        if (footer && footer.style.display !== 'none') {
            return footer.offsetHeight;
        }
        return 0; // 如果footer不存在或隐藏，返回0
    }

    dragWindow(e) {
        // 使用传统的鼠标位置拖拽
        const newX = e.clientX - this.dragOffset.x;
        const newY = e.clientY - this.dragOffset.y;

        // 获取Header和Footer高度
        const headerHeight = this.headerHeight || this.getHeaderHeight();
        const footerHeight = this.getFooterHeight();

        // 改进的边界限制：确保弹窗始终有足够的可见区域
        const minVisibleWidth = 150; // 最小可见宽度（增加到150px）
        const titleBarHeight = 50; // 标题栏高度（确保标题栏可见）

        // 计算边界限制 - 防止弹窗完全移出屏幕
        const minX = 0; // 不允许左侧超出屏幕边界
        const maxX = window.innerWidth - minVisibleWidth; // 右侧必须保留最小可见宽度
        const minY = headerHeight; // 不能超出Header上方
        const maxY = window.innerHeight - footerHeight - titleBarHeight; // 确保标题栏不被footer遮挡

        // 应用边界限制
        const constrainedX = Math.max(minX, Math.min(newX, maxX));
        const constrainedY = Math.max(minY, Math.min(newY, maxY));

        console.log(`🖱️ 拖拽边界: headerHeight=${headerHeight}, footerHeight=${footerHeight}`);
        console.log(`🖱️ 边界限制: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
        console.log(`🖱️ 新位置: (${newX}, ${newY}) → 限制后: (${constrainedX}, ${constrainedY})`);

        // 更新窗口位置
        this.activeWindow.style.left = constrainedX + 'px';
        this.activeWindow.style.top = constrainedY + 'px';
    }


    
    resizeWindow(e) {
        const rect = this.activeWindow.getBoundingClientRect();
        let newWidth = rect.width;
        let newHeight = rect.height;
        
        switch (this.resizeHandle) {
            case 'se':
                newWidth = e.clientX - rect.left;
                newHeight = e.clientY - rect.top;
                break;
            case 's':
                newHeight = e.clientY - rect.top;
                break;
            case 'e':
                newWidth = e.clientX - rect.left;
                break;
        }
        
        // 应用尺寸限制
        newWidth = Math.max(this.minWidth, Math.min(window.innerWidth * 0.9, newWidth));
        newHeight = Math.max(this.minHeight, Math.min(window.innerHeight * 0.9, newHeight));
        
        this.activeWindow.style.width = newWidth + 'px';
        this.activeWindow.style.height = newHeight + 'px';
    }
    
    handleMouseUp() {
        if (this.isDragging || this.isResizing) {
            this.cleanupDragState();
        }
    }

    handleTouchEnd() {
        if (this.isDragging || this.isResizing) {
            console.log('📱 结束垂直拖拽');
            this.cleanupDragState();
        }

        // 清理触摸起始信息
        if (this.touchStartInfo) {
            if (!this.touchStartInfo.hasMoved) {
                console.log('📱 触摸结束，未发生拖拽');
            }
            this.touchStartInfo = null;
        }
    }

    cleanupDragState() {
        // 清理拖拽状态样式
        if (this.activeWindow) {
            this.activeWindow.classList.remove('being-dragged');

            // 恢复标题栏背景
            const dragArea = this.activeWindow.querySelector('h2, .modal-header, .window-drag-area');
            if (dragArea) {
                dragArea.style.background = 'rgba(79, 195, 247, 0.1)';
            }
        }

        // 重置所有状态
        this.isDragging = false;
        this.isResizing = false;
        this.activeWindow = null;
        this.resizeHandle = null;

        // 清理全局样式
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        document.body.classList.remove('window-dragging');
    }
    
    observeNewWindows() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // 检查新添加的节点
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList && (node.classList.contains('floatingMenu') || node.classList.contains('modal-content'))) {
                            setTimeout(() => this.enhanceWindow(node), 100);
                        }

                        const windows = node.querySelectorAll && node.querySelectorAll('.floatingMenu, .modal-content');
                        if (windows) {
                            windows.forEach(window => {
                                setTimeout(() => this.enhanceWindow(window), 100);
                            });
                        }
                    }
                });

                // 检查属性变化（如style.display）
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('modal')) {
                        const modalContent = target.querySelector('.modal-content');
                        if (modalContent && target.style.display === 'flex' && !modalContent.dataset.enhanced) {
                            setTimeout(() => this.enhanceWindow(modalContent), 100);
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
    }
}

// 全局实例
let stableWindowManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    stableWindowManager = new StableWindowManager();
    window.stableWindowManager = stableWindowManager;
});

if (document.readyState !== 'loading') {
    stableWindowManager = new StableWindowManager();
    window.stableWindowManager = stableWindowManager;
}
