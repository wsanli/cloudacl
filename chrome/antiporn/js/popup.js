
$(document).ready(function () {
    try {
        initialize();
    }
    catch (e) {
        $("#msg").html(e);
    }
});
function initialize() {

    initi18n();

    initButtons();

    $("body").fadeOut(1, function () { $(this).show(); });
}
function initi18n() {

    $("#btn-option").html(chrome.i18n.getMessage("configBtn"));
    $("#btn-option").attr("title", chrome.i18n.getMessage("configBtnTip"));
    $("#btn-feedback").html(chrome.i18n.getMessage("feedbackBtn"));
    $("#btn-feedback").attr("title", chrome.i18n.getMessage("feedbackBtnTip"));

    $("#blockSite").attr("title", chrome.i18n.getMessage("blockBtnTip"));
    $("#trustSite").attr("title", chrome.i18n.getMessage("trustBtnTip"));
    $("#cleanSite").attr("title", chrome.i18n.getMessage("removeBtnTip"));
}


function initButtons() {
    var blockSiteButton = $("#blockSite");
    var trustSiteButton = $("#trustSite");
    var cleanSiteButton = $("#cleanSite");

    blockSiteButton.click(function () {
        bindButton(0);
    });
    trustSiteButton.click(function () {
        bindButton(1);
    });
    cleanSiteButton.click(function () {
        bindButton(2);
    });

    chrome.tabs.getSelected(null, function (tab) {
        var proto = bg.cloudaclWebFilter.getUrlProtocol(tab.url);
        if (proto != "http" && proto != "ftp" && proto != "https") {
            blockSiteButton.hide();
            trustSiteButton.hide();
            cleanSiteButton.hide();

            $("#btn-feedback").click(function () {
                openFeedback();
                return false;
            });
        }
        else {
            var host = bg.cloudaclWebFilter.getHostFromTab(tab.url);
            blockSiteButton.html("<b>" + chrome.i18n.getMessage("blockBtn") + ":</b> " + host);
            trustSiteButton.html("<b>" + chrome.i18n.getMessage("trustBtn") + ":</b> " + host);
            cleanSiteButton.html("<b>" + chrome.i18n.getMessage("removeBtn") + "</b>");

            $("#btn-feedback").click(function () {
                openFeedback(host);
                return false;
            });
        }
    }); 
    $("#btn-option").click(function () {
        openConfig();
        return false;
    });
}
function bindButton(action) {
    if (check_password_enabled()) {
        if (bg.verified) {
            actionSite(action)
        }
        else {
            openConfig();
        }
    }
    else {
        actionSite(action)
    }
    return false;
}

function openConfig() {
    chrome.tabs.create({ url: "options.html" });
    window.close();
}
function openFeedback(host) {
    if (host) {
        host = "?url=" + host;
    }
    else {
        host = "";
    }
    chrome.tabs.create({ url: "http://www.cloudacl.com/blockpage/feedback/" + host });
    window.close();
}

function actionSite(id) {
    chrome.tabs.getSelected(null, function (tab) {
        if (id == 0)
            bg_request = "addBlack"
        else if (id == 1)
            bg_request = "addWhite"
        else if (id == 2)
            bg_request = "resetSite"
        var tabid = tab.id;
        var taburl = tab.url;
        chrome.extension.sendRequest({ request: bg_request, url: tab.url, tabid: tab.id }, function (any) {
        });
        if (id == 0) {
            chrome.tabs.update(tabid, { url: taburl });
        }
        else if (id == 1 || id == 2) {
            var p = new bg.cloudaclWebFilter.URLParser(taburl);
            var currentHost = p.getHost();
            var requestUrl = bg.cloudaclWebFilter.getRequestUrl(taburl);
            if (bg.cloudaclWebFilter.isBlockpage(currentHost)) {
                if (!bg.isNewVersion) {
                    chrome.tabs.executeScript(null, { code: "window.history.back()" });
                }
                else {
                    chrome.tabs.update(tabid, { url: requestUrl });
                }
            }
            else {
                chrome.tabs.update(tabid, { url: taburl });
            }
        }
		window.close();
    });
}



