# Streamly 更新日志

## 版本 2.0.0 - 2025-06-21

### 🎉 重大更新：服务器端增强版

这是 Streamly 的一个重大版本更新，将原本的纯前端应用升级为全栈应用，添加了服务器端搜索和播放功能。

### ✨ 新增功能

#### 🔍 服务器端搜索
- **内置搜索功能** - 移除了外部浏览器搜索，改为服务器端 API 搜索
- **YouTube Data API 集成** - 支持使用官方 API 进行视频搜索
- **智能搜索结果** - 改进的搜索结果显示和状态提示
- **搜索状态指示** - 实时显示搜索进度和结果数量

#### 🎵 服务器端视频播放
- **yt-dlp 集成** - 使用 yt-dlp 提取 YouTube 视频流
- **HTML5 视频播放器** - 新增原生 HTML5 视频播放器
- **智能播放器切换** - 自动在服务器端播放和 YouTube iframe 之间切换
- **播放器状态指示** - 显示当前使用的播放器类型
- **多质量支持** - 支持不同视频质量选择

#### 🛠️ 后端 API
- **RESTful API 设计** - 完整的后端 API 架构
- **视频信息获取** - `/api/video/{id}/info` 端点
- **视频流获取** - `/api/video/{id}/stream` 端点
- **搜索功能** - `/api/search` 端点
- **播放列表管理** - 完整的播放列表 CRUD 操作
- **健康检查** - `/api/health` 端点

#### 💾 数据持久化
- **服务器端播放列表存储** - 支持保存播放列表到服务器
- **文件系统存储** - 使用 JSON 文件存储播放列表数据
- **播放列表分享** - 支持通过 ID 分享播放列表

### 🔧 技术改进

#### 后端技术栈
- **Node.js + Express.js** - 现代 Web 服务器框架
- **YouTube Data API v3** - 官方搜索 API 集成
- **yt-dlp** - 强大的视频提取工具
- **node-cache** - 内存缓存优化性能
- **helmet + compression** - 安全和性能中间件

#### 前端增强
- **保持兼容性** - 与原版 Streamly 完全兼容
- **新增 HTML5 播放器** - 支持现代视频播放
- **改进的用户界面** - 中文化界面和更好的状态提示
- **错误处理** - 更好的错误提示和回退机制

### 🌐 用户界面改进

#### 中文化
- **界面本地化** - 主要界面元素中文化
- **状态提示** - 中文状态和错误信息
- **帮助文档** - 中文使用说明

#### 用户体验
- **搜索状态指示** - 实时搜索进度显示
- **播放器状态** - 显示当前播放器类型
- **错误处理** - 友好的错误提示信息
- **加载状态** - 改进的加载指示器

### 📦 部署和配置

#### 环境配置
- **环境变量支持** - 通过 .env 文件配置
- **可选 API 密钥** - YouTube API 密钥为可选配置
- **端口配置** - 可配置服务器端口

#### 部署选项
- **本地开发** - 简单的 npm start 启动
- **生产部署** - 支持 PM2、Docker 等部署方式
- **云平台支持** - 可部署到各种云平台

### 🔄 向后兼容性

- **URL 格式兼容** - 继续支持原有的 URL 播放列表格式
- **功能兼容** - 所有原有功能继续可用
- **界面兼容** - 保持原有界面布局和操作方式
- **数据兼容** - 支持导入原有播放列表数据

### 📋 API 文档

详细的 API 文档请参考 `USAGE.md` 文件，包含所有端点的使用说明和示例。

### 🐛 已知问题

1. **YouTube API 配额限制** - 搜索功能受 YouTube API 每日配额限制
2. **视频地区限制** - 某些视频可能因地区限制无法播放
3. **网络依赖** - 服务器端播放需要稳定的网络连接

### 🔮 未来计划

- **用户认证系统** - 支持用户账户和私人播放列表
- **多平台支持** - 支持更多视频平台（Vimeo、Bilibili 等）
- **协作功能** - 支持多用户协作编辑播放列表
- **移动应用** - 开发原生移动应用
- **Docker 支持** - 提供官方 Docker 镜像

---

## 版本 1.x - 历史版本

原版 Streamly 的更新历史请参考原项目的提交记录。

### 致谢

感谢原 Streamly 项目的开发者 LNFWebsite 创建了这个优秀的项目基础。本 2.0 版本在保持原有精神的基础上，添加了现代化的服务器端功能。
