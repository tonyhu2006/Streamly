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

// * This is the Zen mode function that moves and hides elements

function toggleZen() {
  if (zenMode) {
    zenMode = false;
    $("header, #forkme").removeClass("slideOutUp").addClass("slideInDown");
    $("footer").removeClass("slideOutDown").addClass("slideInUp");
    $("#links").off().css("display", "block").removeClass("fadeOut").addClass("fadeIn");
    $("#main").removeClass("zen");
    $("#zenModeToggle").prop("checked", false);
  }
  else {
    zenMode = true;
    $("header, #forkme").removeClass("slideInDown").addClass("slideOutUp");
    $("footer").removeClass("slideInUp").addClass("slideOutDown");
    $("#links").removeClass("fadeIn").addClass("fadeOut");
    $("#links").on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      $(this).css("display", "none");
    });
    $("#main").addClass("zen");
    $("#zenModeToggle").prop("checked", true);
  }
}

function toggleSBS() {
  if ($("#sbs").length) {
    $("#sbs").remove();
    cookie.del("sbs");
    setBackground();
  }
  else {
    $("head").append("<link id=\"sbs\" rel=\"stylesheet\" href=\"res/css/sbs.css\" type=\"text/css\" />");
    cookie.set("sbs", "1");
  }
}

// * This is the function that is called for toggling the pop-up close user preference

function toggleSearchClose() {
  if (!searchClose) {
    searchClose = true;
  }
  else {
    searchClose = false;
  }
}

function toggleMenu(which) {
  let menu = "#" + which + "Window";
  let shadow = "#" + which + "Shadow";

  // 特殊处理设置窗口，使其与其他弹窗位置一致
  if (which === "settings") {
    const settingsWindow = document.getElementById('settingsWindow');
    if (settingsWindow) {
      const isVisible = settingsWindow.style.display !== 'none';

      if (isVisible) {
        // 关闭设置窗口
        settingsWindow.style.display = 'none';
        $(shadow).css("display", "none");

        // 恢复footer显示
        const footer = document.querySelector('footer');
        if (footer) {
          footer.style.display = 'flex';
          footer.style.visibility = 'visible';
          footer.style.opacity = '1';
          footer.style.zIndex = '1000';
          footer.style.minHeight = '300px';
          footer.style.height = 'auto';
        }
      } else {
        // 显示设置窗口 - 使用与创建新播放列表弹窗相同的定位逻辑

        // 强制隐藏footer区域
        const footer = document.querySelector('footer');
        if (footer) {
          footer.style.display = 'none';
          footer.style.visibility = 'hidden';
          footer.style.opacity = '0';
          footer.style.zIndex = '-1';
        }

        // 设置窗口样式，使其与创建新播放列表弹窗位置一致
        settingsWindow.style.cssText = `
          display: block !important;
          position: fixed !important;
          top: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 2147483647 !important;
          width: 500px !important;
          max-width: calc(100vw - 40px) !important;
          max-height: calc(100vh - 40px) !important;
          margin-top: 20px !important;
          margin-bottom: 20px !important;
        `;

        $(shadow).css("display", "block");
      }
      return;
    }
  }

  // 原有的通用逻辑
  if ($(menu).css("display") !== "none") {
    state = "none";
  }
  else {
    state = "block";
  }
  $(menu).css("display", state);
  $(shadow).css("display", state);

  if (which === "searchResults" && state === "none") {
    $("#inputBox").val("").focus();
    if (hotkeySearchClose) {
      hotkeySearchClose = false;
      toggleSearchClose();
    }
  }
}

// * This object loads the drop overlay over Streamly
// * It is used primarily for when the settings window is toggled and when drag&drop searching is activated

let DropOverlay = function() {
  this.open = function() {
    $("#dropShadow, #dropOverlay").css("display", "initial");
  }
  this.close = function() {
    $("#dropShadow, #dropOverlay").css("display", "none");
  }
}
let dropOverlay = new DropOverlay();

function toggleAutoplayListOverride() {
  if (autoplayListOverride) {
    autoplayListOverride = false;
    $("#autoplayListOverrideToggle").prop("checked", false);
  }
  else {
    autoplayListOverride = true;
    $("#autoplayListOverrideToggle").prop("checked", true);
  }
}

function setBackground(url = false) {
  let b;
  if (!url) {
    let c = cookie.get("background");
    //if (!cookie.get("sbs")) { THIS USED TO SET SBS BACKGROUND TO NONE
    if (c !== "") {
      b = "url(\"" + c + "\") no-repeat center center fixed";
    }
    else {
      b = "url(\"" + background + "\") no-repeat center center fixed";
    }
    //}
    //else {
    //  b = "none";
    //}
  }
  else {
    b = "url(\"" + url + "\") no-repeat center center fixed";
    cookie.set("background", url);
  }
  $("body, #blurBackground").css("background", b).css("background-size", "cover");
}
