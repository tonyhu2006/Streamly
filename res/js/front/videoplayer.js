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

// 新的 HTML5 视频播放器管理
let videoPlayer = null;
let isUsingServerPlayer = true; // 标记是否使用服务器端播放

function initializeVideoPlayer() {
  videoPlayer = document.getElementById('videoPlayer');
  
  if (!videoPlayer) {
    console.error('Video player element not found');
    return;
  }

  // 添加事件监听器
  videoPlayer.addEventListener('loadstart', onVideoLoadStart);
  videoPlayer.addEventListener('canplay', onVideoCanPlay);
  videoPlayer.addEventListener('play', onVideoPlay);
  videoPlayer.addEventListener('pause', onVideoPause);
  videoPlayer.addEventListener('ended', onVideoEnded);
  videoPlayer.addEventListener('error', onVideoError);
  videoPlayer.addEventListener('timeupdate', onVideoTimeUpdate);
  videoPlayer.addEventListener('loadedmetadata', onVideoLoadedMetadata);

  console.log("Debug: HTML5 Video Player initialized");
}

// 视频事件处理函数
function onVideoLoadStart() {
  console.log("Video load start");
}

function onVideoCanPlay() {
  console.log("Video can play");
  if (!videoPaused) {
    videoPlayer.play();
  }
}

function onVideoPlay() {
  console.log("Video playing");
  videoFunctions.play();
  startVideoProgress();
}

function onVideoPause() {
  console.log("Video paused");
  videoFunctions.pause();
}

function onVideoEnded() {
  console.log("Video ended");
  sendStation("playerending");
  loopVideo();
}

function onVideoError(event) {
  console.error("Video error:", event);
  videoErrorIds.push(videos[videoIteration][2]);
  $("tr:nth-child(" + videoIteration + ")").addClass("videoError");
  forwardVideo();
}

function onVideoTimeUpdate() {
  // 更新进度条
  if (videoPlayer && videoPlayer.duration) {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    $("#progress").css("width", progress + "%");
    
    // 更新时间显示
    $("#currentTime").text(formatTime(videoPlayer.currentTime));
    $("#videoTime").text(formatTime(videoPlayer.duration));
  }
}

function onVideoLoadedMetadata() {
  console.log("Video metadata loaded");
  if (videos[videoIteration] && videos[videoIteration][1] === 0) {
    // 设置视频时长
    const duration = Math.round(videoPlayer.duration);
    videos[videoIteration][1] = duration;
    
    const name = videos[videoIteration][0];
    const printTime = msConversion(duration * 1000);
    
    removeVideoFromList(videoIteration, false);
    addVideoToList(name, printTime, videoIteration, false);
    restoreHighlight(videoIteration);
    setPlaylist();
  }
}

// 格式化时间显示
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return minutes + ":" + (secs < 10 ? "0" : "") + secs;
}

// 播放视频函数 - 替换原来的 YouTube 播放器
async function playVideoWithServer(videoId) {
  try {
    // 获取视频流 URL
    const response = await fetch(`/api/video/${videoId}/stream?quality=best`);
    
    if (!response.ok) {
      throw new Error(`获取视频流失败: ${response.status}`);
    }
    
    const streamData = await response.json();
    
    // 设置视频源
    const videoSource = document.getElementById('videoSource');
    videoSource.src = streamData.url;
    
    // 显示 HTML5 播放器，隐藏 YouTube iframe
    $("#videoPlayer").css("display", "block");
    $("#youtube").css("display", "none");

    // 显示播放器状态
    $("#playerStatus").text("服务器端播放").css("display", "block");

    // 加载视频
    videoPlayer.load();

    isUsingServerPlayer = true;
    console.log("Debug: playVideoWithServer - " + videoId);
    
  } catch (error) {
    console.error('服务器端播放失败，回退到 YouTube iframe:', error);
    
    // 回退到 YouTube iframe 播放器
    $("#videoPlayer").css("display", "none");
    $("#youtube").css("display", "block");

    // 显示播放器状态
    $("#playerStatus").text("YouTube 播放").css("display", "block");

    if (!videoPaused) {
      player.loadVideoById(videoId);
    } else {
      player.cueVideoById(videoId);
    }

    isUsingServerPlayer = false;
  }
}

// 播放器控制函数
function playCurrentVideo() {
  if (isUsingServerPlayer && videoPlayer) {
    videoPlayer.play();
  } else if (player) {
    player.playVideo();
  }
}

function pauseCurrentVideo() {
  if (isUsingServerPlayer && videoPlayer) {
    videoPlayer.pause();
  } else if (player) {
    player.pauseVideo();
  }
}

function stopCurrentVideo() {
  if (isUsingServerPlayer && videoPlayer) {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
  } else if (player) {
    player.stopVideo();
  }
}

function getCurrentTime() {
  if (isUsingServerPlayer && videoPlayer) {
    return videoPlayer.currentTime;
  } else if (player && player.getCurrentTime) {
    return player.getCurrentTime();
  }
  return 0;
}

function getDuration() {
  if (isUsingServerPlayer && videoPlayer) {
    return videoPlayer.duration || 0;
  } else if (player && player.getDuration) {
    return player.getDuration();
  }
  return 0;
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  initializeVideoPlayer();
});
