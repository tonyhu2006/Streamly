# Streamly 2.0 使用说明

## 🎉 新功能概述

Streamly 2.0 已经成功升级为全栈应用，具备以下新功能：

### ✅ 已实现的功能

1. **服务器端视频搜索** - 移除了外部浏览器搜索，改为内置搜索功能
2. **服务器端视频播放** - 支持直接在服务器端播放 YouTube 视频
3. **双播放器支持** - 自动在 HTML5 播放器和 YouTube iframe 播放器之间切换
4. **改进的用户界面** - 中文化界面，更好的状态提示

### 🔧 技术架构

- **后端**: Node.js + Express.js
- **视频处理**: yt-dlp + YouTube Data API v3
- **前端**: 原有 HTML/CSS/JavaScript + 新的 HTML5 视频播放器

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 yt-dlp

```bash
pip install yt-dlp
```

### 3. 配置环境变量（可选）

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
PORT=3000
YOUTUBE_API_KEY=your_youtube_api_key_here  # 可选，用于搜索功能
NODE_ENV=development
```

### 4. 启动服务器

```bash
npm start
```

### 5. 访问应用

打开浏览器访问: http://localhost:3000

## 📖 功能说明

### 视频搜索

- **无需 API 密钥**: 可以直接通过视频 URL 添加视频
- **有 API 密钥**: 支持关键词搜索功能

### 视频播放

- **自动选择播放器**: 优先使用服务器端播放，失败时自动回退到 YouTube iframe
- **播放器状态指示**: 右上角显示当前使用的播放器类型
- **完整控制**: 支持播放、暂停、进度控制等

### 播放列表管理

- **保存播放列表**: 通过 API 保存到服务器
- **URL 分享**: 继续支持通过 URL 分享播放列表
- **实时操作**: 支持添加、删除、重新排序

## 🔧 API 端点

### 搜索相关
- `GET /api/search?q={query}` - 搜索视频
- `GET /api/search/trending` - 获取热门视频

### 视频相关
- `GET /api/video/{videoId}/info` - 获取视频信息
- `GET /api/video/{videoId}/stream` - 获取视频流
- `GET /api/video/{videoId}/proxy` - 代理视频流

### 播放列表相关
- `POST /api/playlist` - 保存播放列表
- `GET /api/playlist/{id}` - 获取播放列表
- `PUT /api/playlist/{id}` - 更新播放列表
- `DELETE /api/playlist/{id}` - 删除播放列表

### 系统相关
- `GET /api/health` - 健康检查

## ⚠️ 注意事项

1. **YouTube API 配额**: 搜索功能需要 YouTube Data API v3 密钥，有每日配额限制
2. **视频可用性**: 某些受限制的视频可能无法通过服务器端播放
3. **网络要求**: 服务器端播放需要良好的网络连接
4. **浏览器兼容性**: HTML5 视频播放器需要现代浏览器支持

## 🐛 故障排除

### 搜索不工作
- 检查是否配置了 `YOUTUBE_API_KEY`
- 确认 API 密钥有效且未超出配额

### 视频无法播放
- 检查 yt-dlp 是否正确安装
- 某些视频可能受地区限制
- 应用会自动回退到 YouTube iframe 播放器

### 服务器启动失败
- 检查端口 3000 是否被占用
- 确认所有依赖已正确安装

## 📝 开发说明

### 项目结构
```
├── server.js              # 主服务器文件
├── routes/                 # API 路由
│   ├── search.js          # 搜索相关路由
│   ├── video.js           # 视频相关路由
│   └── playlist.js        # 播放列表相关路由
├── res/js/front/          # 前端 JavaScript
│   ├── videoplayer.js     # 新的视频播放器
│   └── ...                # 其他前端文件
└── data/playlists/        # 播放列表存储目录
```

### 扩展功能
- 可以添加用户认证系统
- 支持更多视频平台
- 添加播放历史记录
- 实现协作播放列表

## 📄 许可证

本项目继承原 Streamly 项目的 Apache 2.0 许可证。
