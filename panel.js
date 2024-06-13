// tested on (please if you tes, add it to list)
//  Vite

let latest = "";
let mappa = {}; // mapp to keep id/uri
let inHover = [];// current in hover [<id>,<uri>]

// possibile types of filetype (we need script ad sm-script)
// looks that react bundles as sm-script the files added meanwhile dev server is on
const types = ["image", "document", "script", "sm-script", "font", "stylesheet"];

// pattern id="RXP-787987-RXP"


const REFRESH_TIME = 1000; // refresh time for main (update the map)


main(); // call main first time

// update main (map)
let mainLoop = setInterval(() => {
  try {
    main()

  } catch (err) {

  }
}, REFRESH_TIME);


// refresh event this event allow to refresh main by popoup.html ui
chrome.runtime.onMessage.addListener(async (request, sender, response) => {
  if (request.type === "reload") {
    main()

  }
})



// main function
// here the map and the panel ui keep updating 
async function main() {

  // get all files
  chrome.devtools.inspectedWindow.getResources(async (resources) => {


    // filter scripts
    let scripts = getJsResources(resources);
    // filter jsx,js,tsx,ts

    let onlyJSX = await getReactComponent(scripts);
 
    // generate and set globally new map
    genMap(onlyJSX);

    // send map refresh event
    chrome.runtime.sendMessage(
      { type: "MAP", data: mappa }
    );

    // this handle the element hover from content.js
    // basically allow to set yellow bg on relative element in panel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

      if (document.querySelector("#main")) {
        if (request.type == "MOUSEOVERFOUND") {
          const index = Object.values(mappa).indexOf(request.url);
          const key = Object.keys(mappa)[index];
          markInPanel(key, "mark")
          if (request.url == latest) return;
          latest = request.url;
        }

        if (request.type == "MOUSEOUT") {
          const index = Object.values(mappa).indexOf(request.url);
          const key = Object.keys(mappa)[index];
          markInPanel(key, "unmark")
        }
      }
    })


    // refresh panel ui
    if (document.querySelector("#main")) {

      let jsx_h1s = document.body.querySelectorAll(".jsx-h1");

      let inHTML = [];
      jsx_h1s.forEach(x => inHTML.push(x.id));

      let real = Object.keys(mappa);


      // ! add new files
      for (let i = 0; i < real.length; i++) {

        const currentReal = real[i];

        if (!inHTML.includes(currentReal)) {
          writeInPanel(mappa[currentReal], currentReal);
        }

      }


      // ! remove old files
      for (let i = 0; i < inHTML.length; i++) {

        const currentInHTML = inHTML[i];
        if (!real.includes(currentInHTML)) {
          jsx_h1s[i].remove();
        }

      }


      function getHTMLfolders() {
        let tmp = [];
        let foldersElements = document.getElementsByClassName("folder");

        for (let element of foldersElements) {
          tmp.push(element.id);
        }
        return tmp;
      }


      function getRealFolders() {
        let tmp = [];
        for (let f of Object.values(mappa)) {
          let splitted = f.split("/");
          if (splitted.length > 1) {
            splitted.pop();
            for (let e of splitted) {
              if (!tmp.includes(e)) {
                tmp.push(e);
              }
            }
          }
        }
        return tmp;
      };

      const realFolders = getRealFolders();
      const htmlFolders = getHTMLfolders();

      for (let htmlFolder of htmlFolders) {
        if (!realFolders.includes(htmlFolder)) {
          document.getElementById(htmlFolder).remove()
        }
      }

    } else { // first time to update panel ui
      let div = document.createElement("div");
      div.id = "main";

      div.style.width = "100%";
      div.style.height = "100%";
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.overflowY = "scroll";

      document.body.append(div);
      for (let [id, value] of Object.entries(mappa)) {
        writeInPanel(value, id)
      }
    }
  });




}


function generateUID() {
  const randomPart = Math.random().toString(36).substr(2, 10);
  const datePart = new Date().getTime().toString(36);
  return randomPart + datePart;
}



const id_key = "RXP" // this must wrap every id to keep trak es RXP-<id>-RXP

// find id in a react component file (matching RXP ids)
function findId(data) {
  let found = "";
  if (data.includes(id_key + "-")) {
    let re = /RXP-(.*?)-RXP/;
    const match = data.match(re);

    if (match) {
      return found = `RXP-${match[1]}-RXP`;
    };

  }
  return found;
}


function getPathFromUrl(url) {
  let splitted = url.split("/");
  let sliced = splitted.slice(3);
  return sliced.join("/")
}

// this function generate and set globally map of all the files
// found in the project
const genMap = async (entries) => {
  let obj = {};
  entries.forEach(x => {

    let id = findId(x.content);
    let uri = getPathFromUrl(x.url);

    if (id != "") {
      obj[id] = uri;
      // writeInPanel(uri);
    } else {
      obj["__no_id__"] = uri;
    }
  });
  mappa = { ...obj }
}


// mark element in panel ui (giving yellow bg)
function markInPanel(id, mark) {
  if (!document.getElementById(id)) return;
  switch (mark) {
    case "mark":
      document.getElementById(id).style.backgroundColor = "yellow";
      break
    case "unmark":
      document.getElementById(id).style.backgroundColor = "white";
      break
    default:
      break
  }
}




// filter only react components

async function getReactComponent(payload) {
  let ok = [];
  const classPattern = /class\s+[A-Z][a-zA-Z0-9]*\s+extends\s+React\.Component\s*\{/;

  const functionPattern = /function\s+[A-Z][a-zA-Z0-9]*\s*\(/;

  const importReactPattern = /import\s+React\s+from\s+['"]react['"];?/;

  for (let data of payload) {
    if(data.url.startsWith("chrome")) continue; // try to access chrome-extension files
    try {
      
      let file = await fetch(data.url);
      let content = (await file.text()).toString();
      if (importReactPattern.test(content)) {
        // console.log(data.url + " passed test 1");
        ok.push({ url: data.url, content: content });
      } else if (functionPattern.test(content)) {
        // console.log(data.url + " passed test 2");
        ok.push({ url: data.url, content: content });
      } else if (classPattern.test(content)) {
        // console.log(data.url + " passed test 3");
        ok.push({ url: data.url, content: content });
      } else {
        // console.log(data.url + " not passed tests")
      }
    } catch (err) {
      console.log(err.message);
    }
  }
  return ok;
}




// filter only scripts file
function getJsResources(resources) {

  // console.log(resources);
  if (!resources || resources.length == 0) return []; // if not resources return empty array

  return resources.filter(x => {
    if ((x.type == "script" || x.type == "sm-script") && x.url.split("/")[3] == "src" && !x.url.startsWith("webpack")) {
      let ext = x.url.split(".").at(-1);
      if (ext == "js" || ext == "jsx" || ext == "ts" || ext == "tsx") {
        return x;
      }
    }
  });

}


// add element in panel as file tree

function writeInPanel(text, id) {
  const splitted = text.split("/");
  const level = splitted.length; // 0=root, 1=child,

  let file = splitted.at(-1);
  let folders = splitted.splice(0, level - 1);


  for (let i = 0; i < folders.length; i++) {
    let folder = folders[i];
    if (!document.querySelector(`.${folder}`)) {
      let new_folder = document.createElement("p");
      new_folder.classList.add(folder, "folder");
      new_folder.setAttribute("id", folder);
      new_folder.style.marginLeft = i == 0 ? "5px" : `${25 * i}px`;
      new_folder.innerHTML = `<i class="fa fa-folder" aria-hidden="true"></i> <span className="folderTitle" >${folder}</span>`;
      new_folder.style.cursor = "pointer";
      document.querySelector("#main").append(new_folder);
    }
  }


  if (!document.getElementById(id)) {
    if (level > 1) { // se è dentro una cartella
      let nearestFolder = folders.at(-1);
      document.querySelector(`.${nearestFolder}`).innerHTML += `<a data-full-path="${text}" style="margin-left:10px; display:block; cursor:pointer" class="jsx-h1 ${file}" id="${id}">${file}</a>`;
    } else { // se è nella root
      document.querySelector("#main").innerHTML += `<a data-full-path="${text}" style="margin-left:10px; display:block; cursor:pointer" class="jsx-h1 ${file}" id="${id}">${file}</a>`;
    }
  }

}

// handle hover on a reference of file in panel ui
function onOver(e) {

  e.stopPropagation();
  e.target.style.backgroundColor = "yellow";
  const path = mappa[e.target.id];
  inHover = [e.target.id, path.trim()]


}

// handle hover exit on a reference of file in panel ui
function onLeave(e) {
  e.stopPropagation();
  e.target.style.backgroundColor = "transparent";

  inHover = "";

  chrome.runtime.sendMessage({ type: "MOUSE-INVERSE", inHover: inHover }, (response) => { });
}


// manage click on reference of a file to open in VSC (needed global url)
// if no global url is set (settable on popup.html) prompt to set it
// if global is set this function will be not called, instead the file open up in VSC
function re() {
  const pathRegex = /^[a-zA-Z]:[\\/](?:[^<>:"\/\\|?*\n]+[\\/])*[^<>:"\/\\|?*\n]*$/;
  inHover = "";
  document.querySelectorAll("a").forEach(e => e.style.backgroundColor = "transparent")


  setTimeout(() => {
    let tryPath = window.prompt("Please set here your project root path to open file in VSC")

    if (!tryPath) return
    if (!pathRegex.test(tryPath.toString().trim())) {
      alert("Path not valid");
    } else {
      chrome.runtime.sendMessage({ type: "setPath", path: tryPath.toString().trim() })
    }

  }, 1);
}


// interval to update hrefs
let pathLoop = setInterval(() => {


  const VSC_PREFIX = "vscode://file";


  chrome.runtime.sendMessage({ type: "getPath" }, (response) => {
    let { path } = response;



    if (path != "") {


      document.querySelectorAll("a").forEach(ancor => {

        let fullLink = `${VSC_PREFIX}/${path}/${ancor.getAttribute("data-full-path").trim()}`;

        ancor.setAttribute("href", fullLink);
        ancor.removeEventListener("click", re);

      })
    } else {

      document.querySelectorAll("a").forEach(ancor => {


        ancor.removeAttribute("href");
        ancor.addEventListener("click", re);

      })

    }
  })


  document.querySelectorAll(".jsx-h1").forEach(el => {
    el.removeEventListener("mouseenter", onOver);
    el.addEventListener("mouseenter", onOver);
  })

  document.querySelectorAll(".jsx-h1").forEach(el => {
    el.removeEventListener("mouseleave", onLeave);
    el.addEventListener("mouseleave", onLeave);
  })


  chrome.runtime.sendMessage({ type: "MOUSEOVER-INVERSE:RESPONSE", inHover: inHover });

}, 1);


// debug function 
function appendResourcesInConsole(resources) {
  let div = document.createElement("div");
  div.style.overflowY = "scroll";

  resources.forEach(x => {

    let h1 = document.createElement("a");
    h1.innerHTML = x.id + "    " + x.file;
    div.appendChild(h1);

  });

  document.body.append(div);
}


// refresh event this event allow to refresh main by popoup.html ui
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === "setPath:front-end") {
    re();
  }else if(request.type == "stop"){
    clearInterval(mainLoop);
    clearInterval(pathLoop);    
  }
})
