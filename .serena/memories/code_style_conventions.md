# Streamly 代码风格和约定

## JavaScript 代码风格

### 命名约定
- **变量名**: 使用 camelCase（如 `videoIteration`, `playlistAutoplay`）
- **函数名**: 使用 camelCase（如 `addVideo`, `playCurrentVideo`）
- **常量**: 使用 camelCase 或 UPPER_CASE（如 `baseAutoplayVideoId`）
- **类名**: 使用 PascalCase（如 `PlaylistManager`, `StableWindowManager`）

### 函数定义
- 主要使用函数声明：`function functionName() {}`
- 事件处理器使用箭头函数或匿名函数
- 类方法定义在类内部

### 变量声明
- 使用 `var`、`let`、`const` 混合（遗留代码风格）
- 全局变量定义在 `global.js` 中
- 模块级变量定义在各自模块顶部

### 代码组织
- **模块化设计**: 功能按模块分离（back/, front/, 独立模块）
- **文件命名**: 使用 kebab-case（如 `playlist-manager.js`）
- **目录结构**: 按功能和层次分组

## HTML/CSS 风格

### HTML 结构
- 使用语义化标签
- 类名使用 kebab-case（如 `video-list`, `search-results`）
- ID 使用 camelCase（如 `videoPlayer`, `searchInput`）

### CSS 约定
- 使用类选择器为主
- 响应式设计优先
- 现代 CSS 特性（Flexbox, Grid）
- 主题文件分离（`modern-theme.css`）

## 注释风格
```javascript
// 单行注释用于简短说明
/* 
 * 多行注释用于详细说明
 * 函数或模块的功能描述
 */

/**
 * JSDoc 风格注释（部分使用）
 * @param {string} videoId - 视频ID
 * @returns {boolean} - 操作是否成功
 */
```

## 错误处理
- 使用 try-catch 块处理异步操作
- 服务器端统一错误处理中间件
- 前端错误通过控制台输出和用户提示

## API 设计约定
- RESTful 风格的 URL 设计
- 统一的 JSON 响应格式
- 错误状态码和消息标准化

## 兼容性考虑
- 支持现代浏览器（ES6+）
- 移动端响应式设计
- 渐进式增强原则