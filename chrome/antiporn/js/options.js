$(document).ready(function () {
	try {
	    initialize();
    }
	catch (e) {
	}
});
function initialize() {

    initUI();
    initVars();
    initEvents();
    initButtons();
    initForms();
    initSettings();
    loadOptions();
    loadAlertOptions();
    loadBLWL();

}
function initUI() {

    $("ul.tabs").tabs("div.panes > div", { "initialIndex": 0 });

    $('[data-tooltip!=""]').qtip({
        content: {
            attr: 'data-tooltip'
        },
        position: {
            my: 'bottom left',
            at: 'top right'
        },
        show: {
            delay: 300
        },
        hide: {
            fixed: true,
            delay: 500
        }
    })
}

var saving;
function initVars() {
    saving = $("#saving");
}
function initEvents() {

    $("#loading").bind("ajaxSend", function () {
        $(this).show();
    }).bind("ajaxComplete", function () {
        $(this).hide();
    });
}
function init_button_need_login(e) {

    saveSettings();

    var $checkbox = $(this);
    var enabled = $checkbox.prop("checked");
    if (enabled) {
        msg($checkbox.data('enable_msg'), 'green', 2500);
        if (!check_login()) {
            ask_login();
        }
        else {
            hide_login();
        }
    } else {
        msg($checkbox.data('disable_msg'), 'green', 2500);
        hide_login();
    }
}
function initButtons() {
    
    $('#lnkRegister').prop("href", backendUrl + "accounts/register/")

    $("#enable_password").data('enable_msg', 'You ENABLED password protection');
    $("#enable_password").data('disable_msg', 'You DISABLED password protection');
    $("#enable_password").change(init_button_need_login);

    $("#bwlist_sync").data('enable_msg', 'You ENABLED sync black/white list');
    $("#bwlist_sync").data('disable_msg', 'You DISABLED sync black/white list');
    $("#bwlist_sync").change(init_button_need_login);
    $("#bwlist_sync").change(function () {
        if ($(this).prop("checked")) {
            bg.syncHelper.setCallBack(function () {
                loadBLWL();
            });
            bg.syncHelper.setFirst();
            bg.syncHelper.schedule_sync(1000);
        }
    });

    $("#btnChangePassword").click(function () {
        $("#change-password").toggle();
    });
    $("#btnToParent").click(function () {
        bg.verified = true;
        initSettings();
    });
    $("#btnToKid").click(function () {
        bg.verified = false;
        initSettings();
    });

    $("#policy").find("input").change(function () {
        saveSettings();
    });

    $("#alert_email").data('enable_msg', 'You ENABLED Email Alert');
    $("#alert_email").data('disable_msg', 'You DISABLED Email Alert');
    $("#alert_sms").data('enable_msg', 'You ENABLED SMS Alert');
    $("#alert_sms").data('disable_msg', 'You DISABLED SMS Alert');
    $("#alert").find("input").change(init_button_need_login);

    $("#enable_toolbar").change(function () {
        var show = $(this).is(':checked');
        if (!show) {
            chrome.browserAction.setPopup({ popup: "" });
            chrome.browserAction.setIcon({ path: "icon_blank.png" });
        }
        else {
            chrome.browserAction.setPopup({ popup: "popup.html" });
            chrome.browserAction.setIcon({ path: "icon.png" });
        }
        saveSettings();
    });
}
function initForms() {

    $('.error').hide();

    $("#frmLogin").submit(function () {
        login($(this),
            function (json) {
                msg(json.message, 'green');
                bg.verified = true;
                $("#id_password").val('');
                initSettings();
            },
            function (json) {
                msg(json.message, 'red', 2400);
            });
        return false;
    });
    $("#frmCheckpass").submit(function () {
        check_password($(this),
            function (json) {
                msg(json.message, 'green');
                bg.verified = true;
                $("#rawpass").val('');
                initSettings();
            },
            function (json) {
                msg(json.message, 'red');
                bg.verified = false;
                initSettings();
            });
        return false;
    });

    $("#frmChangePassword").submit(function () {
        change_password($(this),
            function (json) {
                msg(json.message, 'green');
                $("#change-password").hide();
            },
            function (json) {
                msg(json.message, 'red');
            });
        return false;
    });
}
function initSettings() {

    var pass_enabled = (localStorage['pass_enabled'] === 'true') ? true : false;
    var is_login = check_login();

    $('#login').hide();

    if (is_login) {
        $("#btnChangePassword").show();
    }
    else {
        $("#btnChangePassword").hide();
    }

    if (pass_enabled) {
        $('#enable_password').prop("checked", true);
    }
    else {
        $('#enable_password').prop("checked", false);
    }

    if (pass_enabled && !bg.verified) {

        $('#checkpass').show();

        $('#config').hide();
        $('#password_setting').hide();
        $('#mode').hide();
        $('#alert').hide();
        $('#option').hide();
        $('#buttons').hide();

        if (!is_login) {
            ask_login();
        }
    }
    else {
        $('#checkpass').hide();

        $('#config').show();
        $('#password_setting').show();
        $('#mode').show();
        if (bg.verified) {
            $('#btnToParent').attr('checked', true);
        } else {
            $('#btnToKid').attr('checked', true);
        }
        $('#alert').show();
        $('#option').show();
        $('#buttons').show();
    }

    $('#alert_email').prop("checked", (localStorage['alert_email'] === 'true') ? true : false);
    $('#alert_sms').prop("checked", (localStorage['alert_sms'] === 'true') ? true : false);
    $('#bwlist_sync').prop("checked", (localStorage['bwlist_sync'] === 'true') ? true : false);
    $('#enable_toolbar').prop("checked", (localStorage['enable_toolbar'] === 'false') ? false : true);

}

function ask_login() {
    $('#checkpass').hide();
    $('#login').show(afterLoginShow);
    $("#id_password").val('');
}
function hide_login() {
    $('#checkpass').hide();
    $('#login').hide();
}
function saveSettings() {
    saving.show();

    localStorage['pass_enabled'] = $('#enable_password').prop("checked");
    localStorage['alert_email'] = $('#alert_email').prop("checked");
    localStorage['alert_sms'] = $('#alert_sms').prop("checked");
    localStorage['bwlist_sync'] = $('#bwlist_sync').prop("checked");
    localStorage['enable_toolbar'] = $('#enable_toolbar').prop("checked");
    saveOptions();
    saveAlertOptions();

    setTimeout(function () {
        saving.hide();
    }, 800);
}

function saveAlertOptions() {
    var i = 1;
    for (; i <= 9; i++) {
        var cid_name = "cid" + i + "alert";
        var cid_ctrl = document.getElementById(cid_name);
        localStorage[cid_name] = cid_ctrl.checked ? true : false;
    }
    chrome.extension.sendRequest({ request: "saveAlertOption" });
}
function loadAlertOptions() {
    var i = 1;
    for (; i <= 9; i++) {
        var cid_name = "cid" + i + "alert";
        var cid_ctrl = document.getElementById(cid_name);
        cid_ctrl.checked = (localStorage[cid_name] == "true") ? true : false;
    }
}

function saveOptions() {
    var i = 1;
    for (; i <= 9; i++) {
        var cid_name = "cid" + i + "pref";
        var cid_ctrl = document.getElementById(cid_name);
        var cidpref = localStorage[cid_name];
        localStorage[cid_name] = cid_ctrl.checked ? true : false;
    }
    chrome.extension.sendRequest({ request: "saveOption" });
}
function loadOptions() {
    var i = 1;
    for (; i <= 9; i++) {
        var cid_name = "cid" + i + "pref";
        var cid_ctrl = document.getElementById(cid_name);
        cid_ctrl.checked = (localStorage[cid_name] == "true") ? true : false;
    }
}
function selectAll(isSelectAll) {
    var i = 1;
    for (; i <= 9; i++) {
        var cid_name = "cid" + i + "pref";
        var cid_ctrl = document.getElementById(cid_name);
        cid_ctrl.checked = isSelectAll ? true : false;
    }
}

function loadBLWL() {
    var bwl = bwList.getList();

    var bltext = $("#bltext");
    var wltext = $("#wltext");
    bltext.text(bwl.blacklist.join('\n'));
    wltext.text(bwl.whitelist.join('\n'));

    var bl = $.fn.urllist("#bl", { list: bwl.blacklist, width: 560, delWidth: 75 });
    var wl = $.fn.urllist("#wl", { list: bwl.whitelist, width: 560, delWidth: 75 });

    $("#btnSaveBL").click(function () {
        saving.show();

        var blist = [];
        if (bltext.is(":visible")) {
            blist = $.trim(bltext.val()).split('\n');
        }
        else if (bl.is(":visible")) {
            blist = bl.getlist();
        }

        blist = bwList.clean_list(blist);

        bwList.saveBlackList(blist);
        bltext.text(blist.join('\n'));
        bl.loadlist(blist);

        setTimeout(function () {
            saving.hide();
        }, 800);
    });
    $("#btnSaveWL").click(function () {
        saving.show();

        var wlist = [];
        if (wltext.is(":visible")) {
            wlist = $.trim(wltext.val()).split('\n');
        }
        else if (wl.is(":visible")) {
            wlist = wl.getlist();
        }

        wlist = bwList.clean_list(wlist);

        bwList.saveWhiteList(wlist);
        wltext.text(wlist.join('\n'));
        wl.loadlist(wlist);

        setTimeout(function () {
            saving.hide();
        }, 800);

    });

    var sw1 = $("#blsw").dualtoggle("#bltext", "#bllist", { init: 1, Text: ["List View", "Text View"] });
    var sw2 = $("#wlsw").dualtoggle("#wltext", "#wllist", { init: 1, Text: ["List View", "Text View"] });

}
