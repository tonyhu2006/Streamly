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

function addSearchResult(name, id) {
  searchResultsNameStorage.push(name);
  name = escape(name);
  $("#searchResults").append("<div class=\"searchResult\" onclick=\"loadSearchResult(this);\"><div class=\"left\"><p>" + name + "</p></div><div class=\"right\"><img src=\"https://i.ytimg.com/vi/" + id + "/default.jpg\" /></div></div>");
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

    // 调用服务器端搜索 API
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&maxResults=10`);

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
        addSearchResult(item.title, item.id);
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
