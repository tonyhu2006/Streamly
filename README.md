![Streamly Logo](https://raw.githubusercontent.com/LNFWebsite/Streamly/master/res/img/logo/logo_streamly_color/logo_streamly_color_low_res.png)

# Streamly 2.0 - 服务器端增强版

开源的、基于网页的 YouTube 视频队列 - 现已支持服务器端搜索和播放！

## 🎉 2.0 版本新功能

- ✅ **服务器端视频搜索** - 内置搜索功能，无需外部浏览器
- ✅ **服务器端视频播放** - 直接播放 YouTube 视频流
- ✅ **双播放器支持** - HTML5 播放器 + YouTube iframe 自动切换
- ✅ **改进的用户界面** - 中文化界面，更好的用户体验
- ✅ **RESTful API** - 完整的后端 API 支持

Streamly on Desktop        | Streamly on Mobile
:-------------------------:|:-------------------------:
![](https://raw.githubusercontent.com/LNFWebsite/Streamly/master/examples/05302019/streamly.jpg) | ![](https://raw.githubusercontent.com/LNFWebsite/Streamly/master/examples/05302019/streamlymobile.jpg)
**Side-by-side view**
![](https://raw.githubusercontent.com/LNFWebsite/Streamly/master/examples/05302019/streamlysbs.jpg) |

## 什么是 Streamly？

Streamly 是一个开源的、基于网页的 YouTube 视频队列管理系统。

Streamly 2.0 现在是一个全栈应用，支持服务器端视频搜索和播放功能。它可以用于多种用途，包括排队音乐视频、收听讲座或有声读物，或者简单地创建可以从任何计算机（或平板电脑/手机）访问的视频播放列表。

这与 YouTube 的普通播放列表功能不同，它允许您在播放时操作播放列表（因此使其成为一个队列）。

## 🚀 主要特性

### 2.0 版本新特性：
- **🔍 内置搜索功能** - 服务器端 YouTube 视频搜索，无需外部浏览器
- **🎵 服务器端播放** - 直接播放 YouTube 视频流，支持多种质量选项
- **🔄 智能播放器切换** - 自动在 HTML5 播放器和 YouTube iframe 之间切换
- **💾 服务器端播放列表** - 支持保存和管理播放列表到服务器
- **🌐 RESTful API** - 完整的后端 API，支持第三方集成

### 继承的经典特性：
- **📋 完整的播放列表控制** - 保存所有必要的视频信息（名称、时长、视频ID）
- **🔗 URL 分享** - 通过书签或链接分享播放列表
- **📱 跨平台兼容** - 支持所有现代浏览器和移动设备
- **⚡ 实时操作** - 播放时可以添加、删除、重新排序视频

### *[Subscribe to Streamly on Reddit for updates.](https://www.reddit.com/r/StreamlyReddit/)*

## 🛠️ 如何使用 Streamly 2.0？

### 快速开始

1. **克隆项目**
   ```bash
   git clone https://github.com/tonyhu2006/Streamly.git
   cd Streamly
   ```

2. **安装依赖**
   ```bash
   npm install
   pip install yt-dlp
   ```

3. **配置环境变量（可选）**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加 YouTube API 密钥（用于搜索功能）
   ```

4. **启动服务器**
   ```bash
   npm start
   ```

5. **访问应用**
   打开浏览器访问: http://localhost:3000

### 在线版本
- 原版 Streamly: <https://lnfwebsite.github.io/Streamly>
- 2.0 版本需要本地部署或自己的服务器

***详细使用说明请查看 [USAGE.md](USAGE.md) 文件。***

## FAQ

- What makes this any different from a YouTube playlist?

  A normal YouTube playlist does not allow you to add videos while you are playing the list. It also does not allow you to do advanced playlist manipulation such as re-ordering while playing. Streamly exists more as a queue that you may mess with at any time while playing. This is why most other YouTube players exist as well.

- Will I lose videos that are removed from YouTube?

  No. The playlist will still contain all information on the videos which are broken or removed from YouTube. Streamly will skip the video and highlight it in red to let you know that you must find a replacement. I'm looking into a method that will automatically drop in replacement videos.

- Why is it so important not using a company key to access video metadata?

  This is important because it requires nothing special to operate Streamly. It is currently hosted on GitHub Pages, but may be cloned to any server and will still work the same. The safety of your playlist is achieved by knowing that you may easily run the script on your own without relying on me, GitHub, or anyone else.
  
- Does Streamly work on Mac/iPhone/iPad?

  Yes, Streamly should work just fine on Apple devices as well.

Thanks for taking the time to read! I hope that you will find Streamly as useful as I have. Happy Streaming!

## 🔧 技术架构

### Streamly 2.0 的技术栈

**后端:**
- Node.js + Express.js - Web 服务器框架
- YouTube Data API v3 - 官方搜索 API（可选）
- yt-dlp - 视频流提取工具
- 文件系统存储 - 播放列表持久化

**前端:**
- 原有的 HTML/CSS/JavaScript 架构
- 新增 HTML5 视频播放器
- 保持与原版的兼容性

### 2.0 版本的改进

**服务器端功能:**
- 🔍 内置视频搜索（无需外部浏览器）
- 🎵 直接视频流播放
- 💾 服务器端播放列表存储
- 🔄 智能播放器回退机制

**保持的优势:**
- 📱 跨平台兼容性
- 🔗 URL 播放列表分享
- ⚡ 实时播放列表操作
- 🎛️ 完整的播放控制

### 部署选项

1. **本地开发** - 使用 `npm start` 快速启动
2. **服务器部署** - 支持 Docker、PM2 等部署方式
3. **云平台** - 可部署到 Heroku、Vercel 等平台

If you'd like to know why Streamly was made, head over to the [About](https://github.com/LNFWebsite/Streamly/wiki/About) page in the wiki!

[Dev-testing quick access link](https://raw.githack.com/LNFWebsite/Streamly/master/index.html)
[CDN purge for testing](https://purge.jsdelivr.net/LNFWebsite/Streamly@latest)

## License

```
Copyright 2018 LNFWebsite

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
