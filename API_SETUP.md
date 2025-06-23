# YouTube Data API v3 设置指南

## 获取 YouTube API 密钥

### 步骤 1: 访问 Google Cloud Console
1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 登录您的 Google 账户

### 步骤 2: 创建项目（如果没有）
1. 点击顶部的项目选择器
2. 点击"新建项目"
3. 输入项目名称（如：Streamly-App）
4. 点击"创建"

### 步骤 3: 启用 YouTube Data API v3
1. 在左侧菜单中，点击"API 和服务" > "库"
2. 搜索"YouTube Data API v3"
3. 点击搜索结果中的"YouTube Data API v3"
4. 点击"启用"按钮

### 步骤 4: 创建 API 密钥
1. 在左侧菜单中，点击"API 和服务" > "凭据"
2. 点击"+ 创建凭据" > "API 密钥"
3. 复制生成的 API 密钥
4. （可选）点击"限制密钥"来设置使用限制

### 步骤 5: 配置 API 密钥限制（推荐）
1. 在"应用限制"中选择"HTTP 引荐来源网址"
2. 添加您的域名（如：http://localhost:3000/*）
3. 在"API 限制"中选择"限制密钥"
4. 选择"YouTube Data API v3"
5. 点击"保存"

## 配置到 Streamly

### 方法 1: 环境变量文件
1. 复制 `.env.example` 到 `.env`
2. 编辑 `.env` 文件
3. 将您的 API 密钥添加到 `YOUTUBE_API_KEY=` 后面

### 方法 2: 直接设置环境变量
```bash
export YOUTUBE_API_KEY=your_api_key_here
npm start
```

## API 配额限制

YouTube Data API v3 有以下限制：
- **免费配额**: 每天 10,000 个单位
- **搜索请求**: 每次消耗 100 个单位
- **视频详情**: 每次消耗 1 个单位

这意味着您每天可以进行大约 100 次搜索。

## 故障排除

### 常见错误
1. **403 Forbidden**: API 密钥无效或配额已用完
2. **400 Bad Request**: 请求参数错误
3. **404 Not Found**: API 未启用

### 检查配额使用情况
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目
3. 转到"API 和服务" > "配额"
4. 搜索"YouTube Data API v3"查看使用情况
