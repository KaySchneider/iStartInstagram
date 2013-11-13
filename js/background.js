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

var loadImage = function(uri, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function() {
        callback( {'blob':window.URL.createObjectURL(xhr.response),'uri': uri});
    }
    xhr.open('GET', uri, true);
    xhr.send();
}

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


chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        //inject later here the live id for iStart
        console.log(request,sender);
        //sendResponse({widget:true, config:widgetConfig});
        if (sender.id !== iStartId )
            return;  // don't allow other extensions to connect

        if(request.cmd === 'clicktile') {
            //send the message to the frontend script!

            chrome.runtime.sendMessage({cmd:'clicktile'}, function(data) {
                console.log(data);
            });

        } else {
            console.log(request,sender);
            sendResponse({widget:true, config:widgetConfig});
        }
});