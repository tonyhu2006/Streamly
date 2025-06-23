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
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
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
        // 只设置必要的样式，不破坏现有布局
        if (!windowElement.style.position || windowElement.style.position === 'static') {
            windowElement.style.position = 'fixed';
        }
        
        if (!windowElement.style.zIndex) {
            windowElement.style.zIndex = '1000';
        }
        
        // 设置最小尺寸
        windowElement.style.minWidth = this.minWidth + 'px';
        windowElement.style.minHeight = this.minHeight + 'px';
        
        // 如果没有设置位置，居中显示
        if (!windowElement.style.left && !windowElement.style.top) {
            this.centerWindow(windowElement);
        }
    }
    
    centerWindow(windowElement) {
        const rect = windowElement.getBoundingClientRect();
        const centerX = (window.innerWidth - rect.width) / 2;
        const centerY = (window.innerHeight - rect.height) / 2;
        
        windowElement.style.left = Math.max(0, centerX) + 'px';
        windowElement.style.top = Math.max(0, centerY) + 'px';
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
        
        dragArea.addEventListener('mousedown', (e) => this.startDrag(e, windowElement));
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
        
        windowElement.style.zIndex = '10001';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
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
    
    dragWindow(e) {
        const newX = e.clientX - this.dragOffset.x;
        const newY = e.clientY - this.dragOffset.y;
        
        // 限制在屏幕内
        const maxX = window.innerWidth - this.activeWindow.offsetWidth;
        const maxY = window.innerHeight - this.activeWindow.offsetHeight;
        
        this.activeWindow.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        this.activeWindow.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
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
            this.isDragging = false;
            this.isResizing = false;
            this.activeWindow = null;
            this.resizeHandle = null;
            document.body.style.userSelect = '';
        }
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
