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

// * This function loads the video name
// * Updated video data capture method because of deprecation of player.getVideoData() in API (11/15/2017)

async function getVideoName(id, callback) {
  try {
    // 使用服务器端 API 获取视频信息
    const response = await fetch(`/api/video/${id}/info`);

    if (!response.ok) {
      throw new Error(`获取视频信息失败: ${response.status}`);
    }

    const videoInfo = await response.json();
    callback(videoInfo.title);

  } catch (error) {
    console.error('获取视频名称错误:', error);
    // 回退到原来的方法
    let url = "https://www.youtube.com/watch?v=" + id;
    let get = {
      url: url
    };

    $.ajax({
      dataType: "json",
      url: "https://noembed.com/embed",
      data: get,
      success: function(result) {
        callback(result.title);
      },
      error: function() {
        callback("未知视频");
      }
    });
  }
}

// * This function utilizes function above to add videos with applicable data
// * It used to handle data gathering on it's own, but stands as a wrapper to the async ajax above

function getVideoData(id) {
  let videoId = id;
  let videoTime = 0;

  getVideoName(id, function(name) {
    let videoName = name;
    videoName = encodeURIComponent(videoName).replace(/%20/g, " ");

    if (!inBoxSearch) {
      //skip videos with 'undefined' title
      if (videoName !== "undefined") {
        $("#inputBox").val("").attr("placeholder", placeholder);
        addVideo(videoName, videoTime, videoId);
        
        //if playlist, loop addAutoplayVideo for YouTube playlist import
        //autoplayListOverride is for utilizing YouTube Mix stations without loading all videos
        if (autoplayList && !autoplayListOverride) {
          console.log(autoplayVideoIteration);
          addAutoplayVideo();
        }
      }
      else {
        quickSearchVideosIteration++;
        getVideoData(quickSearchVideos[quickSearchVideosIteration]);
      }
    }
    else {
      //skip and remove 'undefined' videos from quickSearchVideos on inBoxSearch
      if (videoName !== "undefined") {
        addSearchResult(videoName, id, null, null);
        searchResultsIteration++;
      }
      else {
        quickSearchVideos.splice(quickSearchVideosIteration, 1);
        quickSearchVideosIteration--;
      }
      
      if (searchResultsIteration < quickSearchVideos.length - 1) {
        quickSearch("");
      }
      else {
        inBoxSearch = false;
      }
    }
  });
}

// * This function sets the video time on video play
// * It is handled this way since YouTube does not set player.getDuration() until play. Screw you YouTube.

function setVideoTime() {
  if (videos[videoIteration][1] === 0) {
    let name = videos[videoIteration][0];
    let time = player.getDuration();
    time = Math.round(time);
    let printTime = msConversion(time * 1000);

    videos[videoIteration][1] = time;
    removeVideoFromList(videoIteration, false);
    addVideoToList(name, printTime, videoIteration, false);
    restoreHighlight(videoIteration);
    setPlaylist();
  }
}