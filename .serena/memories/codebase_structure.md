# Streamly 代码库结构

## 根目录文件
- `server.js` - 主服务器入口文件
- `index.html` - 前端主页面
- `package.json` - 项目配置和依赖
- `.env.example` - 环境变量示例
- `README.md` - 项目说明文档
- `USAGE.md` - 使用指南

## 目录结构

### `/routes/` - 后端路由
- `search.js` - 搜索相关 API
- `video.js` - 视频相关 API  
- `playlist.js` - 播放列表相关 API

### `/res/` - 前端资源
- `/css/` - 样式文件
  - `styles.css` - 主样式
  - `modern-theme.css` - 现代主题
  - `sbs.css` - 并排视图样式
- `/js/` - JavaScript 文件
  - `/back/` - 后端逻辑模块
    - `base.js` - 基础视频操作
    - `global.js` - 全局变量
    - `data.js` - 数据管理
    - `search.js` - 搜索功能
    - `playlistBack.js` - 播放列表后端逻辑
    - `playlistFront.js` - 播放列表前端逻辑
  - `/front/` - 前端界面模块
    - `videoplayer.js` - 视频播放器
    - `youtube.js` - YouTube API 集成
    - `events.js` - 事件处理
    - `initialize.js` - 初始化
  - 独立功能模块
    - `playlist-manager.js` - 播放列表管理器
    - `local-playlist-manager.js` - 本地播放列表管理
    - `settings-manager.js` - 设置管理
    - `stable-window-manager.js` - 窗口管理
    - `background-selector.js` - 背景选择器
- `/img/` - 图片资源
  - `/logo/` - 各种格式的 Logo 文件
  - `favicon.png` - 网站图标

## 模块化设计
前端采用模块化架构，每个功能模块独立管理：
- 播放器模块 - 视频播放控制
- 搜索模块 - 视频搜索功能  
- 播放列表模块 - 队列管理
- 设置模块 - 用户配置
- 窗口管理模块 - 弹窗和界面控制