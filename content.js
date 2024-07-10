let previousBg = "";
let counter = 0;
let currentInHover = [];
let currentInHoverId = "";
let ok = true;
let globalPath = "";

const hoverColor = "rgba(150, 187, 255, 0.25)"



// ask to see the hovered element in panel.js (to replicate here)
let mouseHoverInverseInterval = setInterval(() => {
    chrome.runtime.sendMessage({ type: "MOSEOVER-INVERSE:REQUEST" }, (response) => {

        if ((!response.inHover || !response.inHover.length)) {
            if ((currentInHoverId != "")) {
                ok = false;
                document.getElementById(currentInHoverId).style.backgroundColor = previousBg;
                if (document.querySelector(`#RXP-${counter}`)) {
                    document.querySelector(`#RXP-${counter}`).remove();
                }
                currentInHoverId = "";
                ok = true;
            }
        } else {



            const id = response.inHover[0];
            const url = response.inHover[1];

            if (document.getElementById(id)) {

                if (id == currentInHoverId || currentInHoverId != "") {
                    if ((currentInHoverId != "")) {
                        ok = false;
                        document.getElementById(currentInHoverId).style.backgroundColor = previousBg;
                        if (document.querySelector(`#RXP-${counter}`)) {
                            document.querySelector(`#RXP-${counter}`).remove();
                        }
                        currentInHoverId = "";
                        ok = true;
                    }
                }

                let e = document.getElementById(id);

                currentInHoverId = id;

                counter++;


                previousBg = e.style.backgroundColor;
                e.style.backgroundColor = hoverColor;
                e.style.cursor = "pointer";


                let banner = document.createElement("span");
                banner.id = `RXP-${counter}`;
                banner.classList.add = `banner`;
                let rect = e.getBoundingClientRect();

                let posX = rect.left + window.scrollX;
                let posY = rect.top + window.scrollY;

                banner.style.position = "absolute";
                banner.style.backgroundColor = "white";
                banner.textContent = url;
                banner.style.top = posY + "px";
                banner.style.left = posX + "px";
                banner.style.padding = "5px";
                banner.style.color = "black";
                document.body.append(banner);

            }
        }

    })
}, 1)



// when mouse hover a element
let mouseHoverListener = document.body.addEventListener("mouseover", e => {
    if (!e.target.id) return;
    chrome.runtime.sendMessage({ type: "MOUSEOVER", id: e.target.id }, (response) => {
        if (response.status == "success" && response.url) {

            if (e.target.id != response.id) return console.log(e.target.id, response);
            previousBg = e.target.style.backgroundColor;
            e.target.style.backgroundColor = hoverColor;
            counter++;
            currentInHover = response.url;
            e.target.classList.add("__rxp_marker__")
            e.target.classList.add("__rxp_ref-" + response.url);
            e.target.classList.add("__mark_n-" + counter)
            e.target.style.cursor = "pointer";



            let banner = document.createElement("span");
            banner.id = `RXP-${counter}`;
            banner.classList.add("banner");
            let rect = e.target.getBoundingClientRect();


            // styling

            const BANNER_OFFSET = 30;

            banner.style.position = "absolute";
            banner.style.backgroundColor = "white";
            banner.textContent = response.url;
            banner.style.color = "black";
            banner.style.height = `${BANNER_OFFSET}`;

            // positioning
            let posX = rect.left + window.scrollX;
            let posY = (rect.top + window.scrollY) - BANNER_OFFSET;
            banner.style.top = posY + "px";
            banner.style.left = posX + "px";


            document.body.append(banner);

            chrome.runtime.sendMessage({ type: "MOUSEOVERFOUND", url: response.url });



        }
    });
});



// when mouse leave a hovered element
let mouseHoverOutListener = document.body.addEventListener("mouseout", e => {
    if (!e.target.id) return;
    chrome.runtime.sendMessage({ type: "MOUSEOUT", url: currentInHover });
    currentInHover = "";
    if (document.querySelector(`#RXP-${counter}`)) {
        document.querySelector(`#RXP-${counter}`).remove();
    }

    e.target.style.backgroundColor = previousBg;

    // remove all listener classes
    e.target.classList.forEach(classe => {
        if (classe.startsWith("__mark_n-")) {
            e.target.classList.remove(classe)
        }
    });
});




function opneVSC(e) {
    const VSC_PREFIX = "vscode://file/";

    const path = VSC_PREFIX + globalPath + "/" + Array.from(e.target.classList).find(x => x.startsWith("__rxp_ref")).split("-")[1];

    // alert(path);
    window.location.href = path;

}

function handleClick(e) {


    if (!globalPath || globalPath == "" || globalPath.length == 0) {
        chrome.runtime.sendMessage({ type: "MOUSEOUT", url: currentInHover });
        currentInHover = "";
        if (document.querySelector(`#RXP-${counter}`)) {
            document.querySelector(`#RXP-${counter}`).remove();
        }
    
        e.target.style.backgroundColor = previousBg;
    
        // remove all listener classes
        e.target.classList.forEach(classe => {
            if (classe.startsWith("__mark_n-")) {
                e.target.classList.remove(classe)
            }
        });
        chrome.runtime.sendMessage({
            type: "setPath:front-end"
        })
        
        
    } else {

        document.querySelectorAll(".__rxp_marker__").forEach(el => {
            el.removeEventListener("click", opneVSC);
            el.addEventListener("click", opneVSC);
        })
    }

}
//  update path and click listeners (to open vsc)
let pathUpdateInterval = setInterval(() => {

    // with prefixed id
    let hoveredElements = [];
    document.querySelectorAll('[id*="RXP"]').forEach(el => {
        hoveredElements.push(el)
    })


    // without prefixed id
    // let hoveredElements = document.querySelectorAll(".__rxp_marker__");


    chrome.runtime.sendMessage({ type: "getPath" }, (response) => {

        if (response?.path) {
            globalPath = response?.path;
            hoveredElements.forEach(element => {
                element.removeEventListener("click", handleClick)
                element.addEventListener("click", handleClick)
            })
        } else {
            hoveredElements.forEach(element => {
                element.removeEventListener("click", handleClick)
                element.addEventListener("click", handleClick)
            })
        }
    });
}, 1);



// UI garbage collector (banners)
let gc = setInterval(() => {

    let currentBanner = document.querySelector(".banner");


    if (currentBanner) {
        let index = currentBanner.id.split("-")[1]; // get the number from id

        // if it is an old over remove it (to avoid bugs where old banner remain
        if (index < counter) {
            currentBanner.remove()
        }

    }


}, 1)

// // ! eventi da fermare alla chiusura della tab
// // ! quando si chiude e si riapre una tab continua la funzione di hover

// clearInterval(pathUpdateInterval)
// removeEventListener("mouseover",mouseHoverListener)
// removeEventListener("mouseout",mouseHoverOutListener)
// clearInterval(mouseHoverInverseInterval)

// document.querySelectorAll('[id*="RXP"]').forEach(el => {
//     el.classList.forEach(_class=>{
//         if(_class.startsWith("__mark_n-")){
//             let index = _class.split("-")[1]; // get index from class


//             if (index < counter) {
//                 currentBanner.
//             }

//         }
//     })
// })


setInterval(() => {
    if (!chrome.runtime?.id) {
        clearInterval(pathUpdateInterval)
        removeEventListener("mouseover", mouseHoverListener)
        removeEventListener("mouseout", mouseHoverOutListener)
        clearInterval(mouseHoverInverseInterval)
    };
}, 1);