/**
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
**/

// Start Quick Search

// 翻译相对时间文本
function translateRelativeTime(timeText) {
  if (!timeText) return '';

  const translations = {
    'second': '秒',
    'seconds': '秒',
    'minute': '分钟',
    'minutes': '分钟',
    'hour': '小时',
    'hours': '小时',
    'day': '天',
    'days': '天',
    'week': '周',
    'weeks': '周',
    'month': '个月',
    'months': '个月',
    'year': '年',
    'years': '年',
    'ago': '前'
  };

  let result = timeText.toLowerCase();

  // 替换英文时间单位为中文
  for (const [english, chinese] of Object.entries(translations)) {
    result = result.replace(new RegExp(english, 'g'), chinese);
  }

  // 处理特殊情况
  result = result.replace(/(\d+)\s*秒前/, '$1秒前');
  result = result.replace(/(\d+)\s*分钟前/, '$1分钟前');
  result = result.replace(/(\d+)\s*小时前/, '$1小时前');
  result = result.replace(/(\d+)\s*天前/, '$1天前');
  result = result.replace(/(\d+)\s*周前/, '$1周前');
  result = result.replace(/(\d+)\s*个月前/, '$1个月前');
  result = result.replace(/(\d+)\s*年前/, '$1年前');

  return result;
}

function addSearchResult(name, id, publishedAt = null, channelTitle = null) {
  searchResultsNameStorage.push(name);
  name = escape(name);

  // 格式化发布时间
  let publishedText = '';
  if (publishedAt) {
    console.log('🕒 原始发布时间:', publishedAt, '类型:', typeof publishedAt); // 调试日志

    // 如果已经是相对时间格式（如 "2 days ago", "1 week ago"），直接翻译使用
    if (typeof publishedAt === 'string' && publishedAt.toLowerCase().includes('ago')) {
      publishedText = translateRelativeTime(publishedAt);
    } else {
      // 尝试解析为日期
      try {
        const publishedDate = new Date(publishedAt);

        // 检查日期是否有效
        if (isNaN(publishedDate.getTime())) {
          console.warn('无法解析日期:', publishedAt);
          publishedText = String(publishedAt);
        } else {
          const now = new Date();
          const diffTime = Math.abs(now - publishedDate);
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          console.log('时间差计算:', { diffMinutes, diffHours, diffDays }); // 调试日志

          if (diffMinutes < 60) {
            publishedText = diffMinutes < 1 ? '刚刚' : `${diffMinutes}分钟前`;
          } else if (diffHours < 24) {
            publishedText = `${diffHours}小时前`;
          } else if (diffDays < 7) {
            publishedText = `${diffDays}天前`;
          } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            publishedText = `${weeks}周前`;
          } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            publishedText = `${months}个月前`;
          } else {
            const years = Math.floor(diffDays / 365);
            publishedText = `${years}年前`;
          }
        }
      } catch (e) {
        console.error('日期解析错误:', e, publishedAt);
        publishedText = String(publishedAt);
      }
    }

    console.log('最终发布时间文本:', publishedText); // 调试日志
  }

  // 构建HTML结构
  const channelInfo = channelTitle ? `<div class="searchResultChannel">${escape(channelTitle)}</div>` : '';
  const publishedInfo = publishedText ? `<div class="searchResultPublished">${publishedText}</div>` : '';

  $("#searchResults").append(`
    <div class="searchResult" onclick="loadSearchResult(this);">
      <div class="left">
        <div class="searchResultTitle">${name}</div>
        ${channelInfo}
        ${publishedInfo}
      </div>
      <div class="right">
        <img src="https://i.ytimg.com/vi/${id}/default.jpg" />
      </div>
    </div>
  `);
}

function loadSearchResult(element) {
  let iteration = $(".searchResult").index(element);
  let id = quickSearchVideos[iteration];
  console.log("i:" + iteration + ",id:" + id);

  //getVideoData function equivalent without reloading video names
  let videoId = id;
  let videoTime = 0;
  let videoName = searchResultsNameStorage[iteration];
  addVideo(videoName, videoTime, videoId);

  if (searchClose) {
    toggleMenu("searchResults");
  }
}

// * This function loads the video for the Quick Search functionality

function quickSearch(query) {
  //console.log("debug: quickSearch(\"" + query + "\")");

  if (!inBoxSearch && quickSearchVideosIteration + 1 < quickSearchVideos.length) {
    $("#inputBox").val("").attr("placeholder", loadingPlaceholder);
  }
  if (query !== "") {
    $("#searchProgress").css("display", "flex");

    quickSearchQuery = query;
    let searchDataFrame = document.createElement("iframe");
    searchDataFrame.setAttribute("id", "searchDataFrame");
    searchDataFrame.setAttribute("src", "");
    document.getElementById("dataFramesContainer").appendChild(searchDataFrame);
    searchDataPlayer = new YT.Player('searchDataFrame', {
      events: {
        'onReady': onSearchDataPlayerReady,
        'onStateChange': onSearchDataPlayerStateChange
      }
    });
    searchDataFrame.setAttribute("src", "https://www.youtube.com/embed/?enablejsapi=1");
  }
  else if (quickSearchVideosIteration + 1 < quickSearchVideos.length) {
    quickSearchVideosIteration++;
    getVideoData(quickSearchVideos[quickSearchVideosIteration]);
  }
}

// * This function cues the search results for use in the next function

let searchDataPlayerErrors = 0;
function onSearchDataPlayerReady() {
  try {
    searchDataPlayer.cuePlaylist({listType: "search", list: quickSearchQuery});
  }
  catch(e) {
    searchDataPlayerErrors++;
    console.log(e);
    if (searchDataPlayerErrors <= 5) {
      try {
        searchDataPlayer.destroy();
      } catch(e) {};
      quickSearch(quickSearchQuery);
    }
  }
}

// * This function uses the search results to add the next video

function onSearchDataPlayerStateChange(event) {
  if (event.data === 5) {
    if (!inBoxSearch) {
      $("#inputBox").val("").attr("placeholder", placeholder).blur().focus();
    }
    quickSearchVideosIteration = 0;
    quickSearchVideos = searchDataPlayer.getPlaylist();
    let data = searchDataPlayer.getVideoUrl();
    
    let id = urlValidate(data);
    if (id) {
      if (id[0] === "playlist") {
        id = id[1][0];
      }
      else if (id[0] === "youtube") {
        id = id[1];
      }
    }
    
    searchDataPlayer.destroy();
    if (inBoxSearch) {
      $(".searchResult").remove();
      searchResultsIteration = 0;
      searchResultsNameStorage = [];
      //as long as not open already (trying to search twice will close on second)
      if ($("#searchResultsWindow").css("display") !== "block") {
        toggleMenu("searchResults");
      }
    }
    getVideoData(id);
    
    $("#searchProgress").css("display", "none");
  }
}

// End Quick Search

// 新的服务器端搜索功能
async function serverSearch(query) {
  try {
    $("#searchProgress").css("display", "flex");
    $("#searchStatus").text("正在搜索...").css("display", "block");

    // 获取用户设置的搜索结果数量
    const maxResults = settingsManager ? settingsManager.settings.searchResultsCount : 20;

    // 调用服务器端搜索 API
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("YouTube API 配额已用完或 API 密钥无效");
      } else if (response.status === 400) {
        throw new Error("搜索参数无效");
      } else {
        throw new Error(`搜索失败: ${response.status}`);
      }
    }

    const data = await response.json();

    // 清空之前的搜索结果
    $(".searchResult").remove();
    searchResultsIteration = 0;
    searchResultsNameStorage = [];
    quickSearchVideos = [];

    if (data.items && data.items.length > 0) {
      // 添加搜索结果
      data.items.forEach((item, index) => {
        quickSearchVideos.push(item.id);
        addSearchResult(item.title, item.id, item.publishedAt, item.channelTitle);
      });

      $("#searchStatus").text(`找到 ${data.items.length} 个结果`).css("color", "#4CAF50");
    } else {
      $("#searchStatus").text("未找到相关视频").css("color", "#FF9800");
    }

    // 显示搜索结果窗口
    if ($("#searchResultsWindow").css("display") !== "block") {
      toggleMenu("searchResults");

      // 🔧 使用延迟执行居中逻辑，确保窗口完全显示后再居中
      console.log('🔍 搜索成功，延迟执行居中逻辑');

      // 使用短延迟确保窗口完全显示
      setTimeout(() => {
        const searchWindow = document.getElementById('searchResultsWindow');

        if (!searchWindow) {
          console.log('🔍 搜索窗口未找到');
          return;
        }

        // 检查窗口是否真正可见
        const isVisible = searchWindow.style.display === 'block' &&
                         searchWindow.offsetParent !== null;

        if (!isVisible) {
          console.log('🔍 搜索窗口不可见，跳过居中');
          return;
        }

        // 强制居中，不检查现有位置
        console.log('🔍 强制居中搜索结果窗口');

        // 优先使用窗口管理器
        if (window.stableWindowManager && typeof window.stableWindowManager.centerWindow === 'function') {
          console.log('🔍 使用窗口管理器居中');
          window.stableWindowManager.centerWindow(searchWindow);
        } else {
          // 备用方案：手动计算居中位置
          console.log('🔍 使用备用居中方案');

          const header = document.querySelector('header');
          const footer = document.querySelector('footer');

          // Header高度计算
          let headerHeight = 70; // 默认值
          if (header && header.offsetHeight > 0) {
            headerHeight = header.offsetHeight;
          }

          // Footer高度计算
          let footerHeight = 400; // Streamly默认Footer高度
          if (footer && footer.offsetHeight > 0) {
            footerHeight = footer.offsetHeight;
          }

          // 获取窗口实际尺寸
          const rect = searchWindow.getBoundingClientRect();
          const windowWidth = rect.width || searchWindow.offsetWidth || 600;
          const windowHeight = rect.height || searchWindow.offsetHeight || 400;

          const availableHeight = window.innerHeight - headerHeight - footerHeight;
          const availableWidth = window.innerWidth;

          const centerX = (availableWidth - windowWidth) / 2;
          const centerY = headerHeight + (availableHeight - windowHeight) / 2;

          // 确保不超出边界
          const constrainedX = Math.max(0, Math.min(centerX, availableWidth - windowWidth));
          const constrainedY = Math.max(headerHeight, Math.min(centerY, headerHeight + availableHeight - windowHeight));

          searchWindow.style.left = constrainedX + 'px';
          searchWindow.style.top = constrainedY + 'px';

          console.log(`🔍 手动居中完成:
            Header高度=${headerHeight}, Footer高度=${footerHeight}
            窗口尺寸=${windowWidth}x${windowHeight}
            可用区域=${availableWidth}x${availableHeight}
            最终位置=(${constrainedX}, ${constrainedY})`);
        }
      }, 150); // 150ms延迟，确保窗口完全显示
    }

    $("#searchProgress").css("display", "none");
    $("#inputBox").val("").attr("placeholder", placeholder).blur().focus();

    // 3秒后隐藏状态信息
    setTimeout(() => {
      $("#searchStatus").css("display", "none");
    }, 3000);

  } catch (error) {
    console.error('服务器端搜索错误:', error);
    $("#searchProgress").css("display", "none");
    $("#searchStatus").text(`搜索错误: ${error.message}`).css("color", "#F44336").css("display", "block");
    $("#inputBox").val("").attr("placeholder", "搜索失败，请重试...").blur().focus();

    // 显示搜索结果窗口以显示错误信息
    if ($("#searchResultsWindow").css("display") !== "block") {
      toggleMenu("searchResults");

      // 使用与成功情况相同的居中逻辑
      setTimeout(() => {
        const searchWindow = document.getElementById('searchResultsWindow');

        if (!searchWindow) {
          console.log('❌ 搜索窗口未找到');
          return;
        }

        const isVisible = searchWindow.style.display === 'block' &&
                         searchWindow.offsetParent !== null;

        if (!isVisible) {
          console.log('❌ 搜索窗口不可见，跳过居中');
          return;
        }

        console.log('❌ 强制居中搜索错误窗口');

        if (window.stableWindowManager && typeof window.stableWindowManager.centerWindow === 'function') {
          console.log('❌ 使用窗口管理器居中');
          window.stableWindowManager.centerWindow(searchWindow);
        } else {
          console.log('❌ 使用备用居中方案');

          const header = document.querySelector('header');
          const footer = document.querySelector('footer');

          let headerHeight = 70;
          if (header && header.offsetHeight > 0) {
            headerHeight = header.offsetHeight;
          }

          let footerHeight = 400;
          if (footer && footer.offsetHeight > 0) {
            footerHeight = footer.offsetHeight;
          }

          const rect = searchWindow.getBoundingClientRect();
          const windowWidth = rect.width || searchWindow.offsetWidth || 600;
          const windowHeight = rect.height || searchWindow.offsetHeight || 400;

          const availableHeight = window.innerHeight - headerHeight - footerHeight;
          const availableWidth = window.innerWidth;

          const centerX = (availableWidth - windowWidth) / 2;
          const centerY = headerHeight + (availableHeight - windowHeight) / 2;

          const constrainedX = Math.max(0, Math.min(centerX, availableWidth - windowWidth));
          const constrainedY = Math.max(headerHeight, Math.min(centerY, headerHeight + availableHeight - windowHeight));

          searchWindow.style.left = constrainedX + 'px';
          searchWindow.style.top = constrainedY + 'px';

          console.log(`❌ 错误居中完成: 位置=(${constrainedX}, ${constrainedY})`);
        }
      }, 150);
    }

    // 5秒后恢复正常占位符和隐藏状态
    setTimeout(() => {
      $("#inputBox").attr("placeholder", placeholder);
      $("#searchStatus").css("display", "none");
    }, 5000);
  }
}
