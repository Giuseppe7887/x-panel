



// Invia un messaggio allo script di background quando il popup è aperto
document.addEventListener('DOMContentLoaded', () => {



    chrome.runtime.sendMessage({ type: "getPath" }, async (response) => {

        let { path } = response;


        if (path && path != "") {
            document.getElementById("initial-path-selection").value = path;
            document.getElementById("initial-path-selection").style.border = "none";
            document.getElementById("initial-path-confirm").innerHTML = "change";
            // document.getElementById("initial-path-selection-text").innerHTML = "Your root path is";
            document.getElementById("initial-path-selection").style.borderBottom = "solid 1px gray";

        }
    })

    chrome.runtime.sendMessage({ type: "POPUP_OPENED" }, function (response) {
        console.log("Risposta dallo script di background:", response);
        if (response.message) {
            document.getElementById("not-ready").remove()
            document.getElementById("ready").style.display = "flex";
        }
    });

    document.querySelector("button").addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "reload" })
    })


    document.getElementById("initial-path-confirm").addEventListener("click", async () => {
        if (!document.getElementById("initial-path-selection").value) return;
        try {
            const pathRegex = /^(?:[a-zA-Z]:[\\/](?:[^<>:"\/\\|?*\n]+[\\/])*(?:[^<>:"\/\\|?*\n]*)|\/(?:[^<>:"\/\\|?*\n]+\/)*(?:[^<>:"\/\\|?*\n]*)?)$/;


            const isPath = pathRegex.test(document.getElementById("initial-path-selection").value);


            if (!isPath) {
                document.getElementById("err").innerHTML = "Path not valid";
                document.getElementById("err").style.color = "red";
            } else {
                document.getElementById("err").innerHTML = "Path accepted";
                document.getElementById("err").style.color = "green";
                document.getElementById("initial-path-confirm").innerHTML = "change";
                document.getElementById("initial-path-selection").style.border = "none";
                // document.getElementById("initial-path-selection").style. = "solid 1px black";
                // document.getElementById("initial-path-selection-text").innerHTML = "Your root path is";
                chrome.runtime.sendMessage({ type: "setPath", path: document.getElementById("initial-path-selection").value.toString() });
            }






            // fetch(document.getElementById("initial-path-confirm").value.toString())
        } catch (err) {

        }
    })
});

