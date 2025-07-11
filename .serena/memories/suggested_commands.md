# Streamly 开发常用命令

## 项目启动命令
```bash
# 安装依赖
npm install

# 安装 yt-dlp（Python 包）
pip install yt-dlp

# 启动开发服务器（自动重启）
npm run dev

# 启动生产服务器
npm start

# 直接启动
node server.js
```

## 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（可选配置 YouTube API 密钥）
# PORT=3000
# YOUTUBE_API_KEY=your_api_key_here
# NODE_ENV=development
```

## Windows 系统常用命令
```cmd
# 查看目录内容
dir

# 切换目录
cd directory_name

# 查看当前目录
cd

# 查找文件
dir /s filename

# 查看进程
tasklist

# 结束进程
taskkill /PID process_id

# 查看端口占用
netstat -ano | findstr :3000

# Git 操作
git status
git add .
git commit -m "message"
git push
git pull
```

## 开发工具命令
```bash
# 查看 Node.js 版本
node --version

# 查看 npm 版本  
npm --version

# 查看已安装包
npm list

# 更新包
npm update

# 清理 npm 缓存
npm cache clean --force
```

## 服务器相关
```bash
# 检查服务器健康状态
curl http://localhost:3000/api/health

# 查看服务器日志（如果使用 PM2）
pm2 logs

# 重启服务（如果使用 PM2）
pm2 restart streamly
```

## 调试命令
```bash
# 启动调试模式
node --inspect server.js

# 查看详细错误信息
NODE_ENV=development npm start
```