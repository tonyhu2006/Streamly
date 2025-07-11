# Streamly 技术栈

## 后端技术
- **Node.js + Express.js** - Web 服务器框架
- **YouTube Data API v3** - 官方搜索 API（可选）
- **yt-dlp** - 视频流提取工具
- **文件系统存储** - 播放列表持久化

## 前端技术
- **HTML/CSS/JavaScript** - 原有架构
- **HTML5 视频播放器** - 新增播放器
- **jQuery** - DOM 操作和事件处理
- **Font Awesome** - 图标库
- **Animate.css** - 动画效果
- **Google Fonts** - 现代化字体（Inter, Roboto）

## 依赖包
### 主要依赖
- `express` - Web 框架
- `axios` - HTTP 客户端
- `cheerio` - 服务器端 HTML 解析
- `googleapis` - Google API 客户端
- `yt-dlp-wrap` - yt-dlp 包装器
- `fluent-ffmpeg` - 视频处理
- `cors` - 跨域资源共享
- `helmet` - 安全中间件
- `compression` - 响应压缩
- `node-cache` - 内存缓存

### 开发依赖
- `nodemon` - 开发时自动重启

## 架构特点
- **模块化设计** - 前端采用模块化 JavaScript 架构
- **RESTful API** - 完整的后端 API 支持
- **响应式设计** - 支持多种设备尺寸
- **渐进式增强** - 保持与原版的兼容性