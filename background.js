
let mappa = []; // map to keep all react components and their uri/id
let inHover = ""; // current id in hover (to search in map) it arrives by panel.js an update frequentely
let path = ""; // global path set by user (to open vsc)

// Relay to let comunicate content.js and panel.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    // get update map - panel.js -> background.js
    case "MAP":
      mappa = request.data;
      break;
    // mouse hover - content.js -> background.js
    case "MOUSEOVER":
      if (!mappa) return;
      let found = mappa[request.id];
      if (found && found != "" && found != "__no_id__") {
        sendResponse({ status: "success", url: found, id: request.id });
      } else {
        sendResponse({ status: "error", message: "element not found" });
      }
      break;
    case "POPUP_OPENED":
      sendResponse({ message: Object.keys(mappa).length > 0 });
      break;
    // update frequently the current element in hover in panel.js - content.js -> background.js
    case "MOUSEOVER-INVERSE:RESPONSE":
      inHover = request.inHover;
      break
    // get the current element in hover in panel content.js -> background.js
    case "MOSEOVER-INVERSE:REQUEST":
      sendResponse({ inHover: inHover });
      break
    // update frequently the global path to open in VSC - panel.js ->  background.js
    case "setPath":

      // removing src/ src\ src from path
      let len = request.path.length;
      if(len == 0) return;
      if (request.path.endsWith("src")) request.path = request.path.substring(0, len - 3);
      if (request.path.endsWith("src/")) request.path = request.path.substring(0, len - 4);
      if (request.path.endsWith("src\\")) request.path = request.path.substring(0, len - 4);
      path = request.path;
      // get the global path to open file in VSC - content.js -> background.js
      break
    case "getPath":
      sendResponse({ path: path });
      break
    default:
      sendResponse({ status: "idle" })
      break
  }
});


chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  // reset path on closing tab
  path = "";

})


