_DEBUG = false;
_DEBUG_OLD = false;
var verified = false;
var pollInterval = 5*60*60*1000; //5 hr
var startInterval = 3*1000;  //3 sec
var notifyTimeout = 5*60*1000;  //5 min
var notifymessage = [];
var isNewVersion = false;

function isWhite(tabId, url) {
    return (url.indexOf('googlesyndication') != -1
        || url.indexOf('www.google.com/webhp') != -1
        || url.indexOf('facebook.com/dialog/') != -1
        || url.indexOf('https://www.facebook.com/login.php') == 0
        || url.indexOf('https://accounts.google.com/ServiceLogin') == 0
        || url.indexOf('chrome-') == 0
        || url.indexOf('chrome://') == 0
        || tabId == -1
        );
}
function onBeforeRequestHandler(details) {

    if (details.type === "main_frame" || details.type === "other") {
        updateTab({ id: details.tabId, url: details.url });
    }
    return { cancel: false };
}
window.onload = function () {

    if (!_DEBUG_OLD) {
        if (chrome.webRequest) {
            isNewVersion = true;
        }
    }

    chrome.extension.onRequest.addListener(
	    function (request, sender, sendResponse) {
	        var responseData = {};
	        if (request.request == "saveOption") {
	            cloudaclWebFilter.clearUrlCache();
	            cloudaclWebFilter.BlockPolicyInit();
	            cloudaclWebFilter.updateUrlCacheFromStorage();
	        }
	        else if (request.request == "saveAlertOption") {
	            cloudaclWebFilter.AlertPolicyInit();
	        }
	        else if (request.request == "addBlack") {
	            var host = cloudaclWebFilter.getHostFromTab(request.url);
	            if (host) {
	                cloudaclWebFilter.addSite2BlackList(host);
	                syncHelper.save();
	            }
	        }
	        else if (request.request == "addWhite") {
	            var host = cloudaclWebFilter.getHostFromTab(request.url);
	            if (host) {
	                cloudaclWebFilter.addSite2WhiteList(host);
	                syncHelper.save();
	            }
	        }
	        else if (request.request == "resetSite") {
	            var host = cloudaclWebFilter.getHostFromTab(request.url);
	            if (host) {
	                cloudaclWebFilter.removeSiteFromBWList(host);
	                syncHelper.save();
	            }
	        }
	        sendResponse(responseData);
	    });

    try { /* new api */
        if (_DEBUG_OLD) {
            throw "DEBUG";
        }
        chrome.webRequest.onHeadersReceived.addListener(onBeforeRequestHandler, { urls: ["http://*/*", "https://*/*"] }, ["blocking"]);
    }
    catch (e) {
        /* old fashion */
        chrome.tabs.onUpdated.addListener(
                function (tabId, changeInfo, tab) {
                    if (isWhite(tabId, tab.url)) {
                        return;
                    }
                    if (changeInfo.status == 'loading') {
                        updateTab(tab);
                    }
                });
    }


    window.onunload = function () {
        verified = false;
    };

    window.setTimeout(function () {
        schedule_check_notification(startInterval);
    }, 0);

    if (localStorage && localStorage.getItem('enable_toolbar') !== null && !(localStorage['enable_toolbar'] === 'true') ? true : false) {
        chrome.browserAction.setPopup({ popup: "" });
        chrome.browserAction.setIcon({ path: "icon_blank.png" });
    }
}

function updateTab(tab) {

    try {
        if (isWhite(tab.id, tab.url)) {
            return { action: false };
        }

        if (tab.incognito && tab.incognito == true) {
            chrome.tabs.update(tab.id, { url: "about:kill" });
            return { action: false };
        }
        if (tab.url.indexOf('www.google.com') != -1 && tab.url.indexOf('q=') != -1 && tab.url.indexOf('safe=high') == -1) {
            if (tab.url.indexOf('/search?') != -1) {
                chrome.tabs.update(tab.id, { url: tab.url + '&safe=high' });
                return { action: false };
            }
            else if (tab.url.indexOf('/url?') != -1) {
                return { action: false };
            }
        }
    }
    catch (e) {
    }
    return cloudaclWebFilter.processNewURL(tab.url, tab.id);
}

