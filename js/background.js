/**
 * Created by kay on 12.11.13.
 */
/**
 * on installation
 */
var iStartId = "fogdllloglagleoeofopkaikhjfcjpik";
chrome.runtime.onMessage.addListener(
    //make the request to instagram in the background script!!! Simple as we can
    function(request,sender,sendResponse) {
        console.log(request, sender, sendResponse);
        if(request.cmd === 'get')
            loadInstagram(request.url,sendResponse);
        if(request.cmd === 'loadImage')
            loadImage(request.uri,sendResponse);
        return true;

    }
);

//load config via xhr
var widgetConfig = {
    "name": "InstagramTopPictures",
    "description":"live tile with instagram top pictures",
    "iswidget":true,
    "fullscreen":chrome.extension.getURL('html/instaWidget.html'),
    "src":  chrome.extension.getURL("html/instaWidget.html"),
    "sendClick": true,
    "multiple":true, //can be added more than one time into the browser
    "min_width":2,
    "min_height":2,
    "extensionid":chrome.i18n.getMessage("@@extension_id")
};

/**
 * this is not an full client API only an short snippet to launch an link in the browser
 * with the knowledge of iStart application!
 * @type {{tabid: number, extensionUrl: *, launchlink: Function}}
 */
var istartliveTileApi = {
    tabid : 0,
    extensionUrl: chrome.extension.getURL('html/instaWidget.html'),
    launchlink: function (data) {
        chrome.runtime.sendMessage(iStartId,{cmd: "launchlink",url:this.extensionUrl,launchlink:data.link,tabId:data.tabid}, function(response) {
            //filter the message direct here
            if(response.url !== extensionUrl) {
                return false;
            }
            if(response.response==='ok') {
                console.log('everything is fine');
            } else {
                console.log("wahuu...something is gone wrong");
            }
        });
    }
};

/**
 * load an external image as blob
 * @param uri
 * @param callback
 */
var loadImage = function(uri, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function() {
        callback( {'blob':window.URL.createObjectURL(xhr.response),'uri': uri});
    }
    xhr.open('GET', uri, true);
    xhr.send();
}

/**
 * call the instagram api with json
 * @param uri
 * @param callback
 */
var loadInstagram = function(uri, callback) {
    var xhr = new XMLHttpRequest();
    var response = callback;
    xhr.responseType = 'json';
    xhr.onload = function() {
        //console.log(xhr.response, uri);
        callback({json:xhr.response});
    }
    xhr.open('GET', uri, true);
    xhr.send();
}


/**
 * add event listener for the communication with iStart
 * reject all messages from other extensions
 */
chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {

        if (sender.id !== iStartId )
            return;  // don't allow other extensions to connect

        if(request.cmd === 'clicktile') {
            //send the message to the frontend script! and ask for the link of the current shown up image
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                //send it to the actual shown tab into the frontend script. So we dont send it to another tab and became an wrong link
                chrome.tabs.sendMessage(tabs[0].id, {cmd: "clicktile"}, function(response) {
                    if(response.link) {
                        //launch the link via istart api
                        istartliveTileApi.launchlink({"link":response.link,"tabid": tabs[0].id});
                    }
                });
            });
        } else {
            //all other request from istart becomes the widget configurateion object back
            sendResponse({widget:true, config:widgetConfig});
        }
});