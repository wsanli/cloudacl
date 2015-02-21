var backendDomain = "www.cloudacl.com";
var backendUrl = "http://www.cloudacl.com/";
var bg = chrome.extension.getBackgroundPage();




function msg(data, color, time) {
    if (!time)
        time = 700;
    $('#msg').html(data).css('color', color).fadeIn(300).delay(time).fadeOut(200);
}
function clean_sort_list(list) {
    try {
        list = (list || []).filter(function (e, i, a) {
            return ($.trim(e) == "") ? false : true;
        });
    }
    catch (e) {
    }
    list = $.unique(list).sort();
    return list;
}

function check_password_enabled() {
    if (localStorage['pass_enabled'] === 'true') {
        return true;
    }
    else {
        return false;
    }
}
function hasLocalEmail() {
    try {
        if (localStorage['email'] && localStorage['email'].length > 0) {
            return localStorage['email'];
        }
        return false;
    }
    catch (e) {
        return false;
    }
}
function afterLoginShow(obj) {
    var email = hasLocalEmail();
    if (email) {
        $("#id_username").val(email);
    }
}



function login(frm, success_todo, unsuccess_todo) {
    $.ajax({
        type: 'POST',
        async: true,
        timeout: 100000,
        url: backendUrl + "addon/login/",
        data: frm.serialize(),
        dataType: 'json',
        headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
        beforeSend: function () {
        }
    }).done(function (json) {
        if (json.success) {
            localStorage['email'] = frm.find("#id_username").val();
            success_todo(json);
        }
        else {
            unsuccess_todo(json);
        }
    })
    .error(function (jqxhr, status, err) {
        $('#msg').append('<br>' + status + ', ' + err);
    });
}

function logout(todo) {
    if (confirm("Are you sure to sign out?")) {
        $.ajax({
            type: 'GET',
            async: true,
            timeout: 100000,
            url: backendUrl + "addon/logout/",
            dataType: 'html',
            headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
            success: function (data) {
                $('#msg').html(data).fadeIn(300).delay(700).fadeOut(200);
                todo();
            }
        }).error(function (jqxhr, status, err) {
            $('#msg').append('<br>' + status + ', ' + err);
        });
    }
    else {
        return false;
    }
}
function check_login() {
    var login;
    $.ajax({
        type: 'GET',
        async: false,
        timeout: 5000,
        url: backendUrl + "addon/checklogin/",
        dataType: 'json',
        headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
        success: function (json) {
            if (json.not_authenticated) {
                login = false;
            }
            else {
                login = true;
            }
        }
    }).error(function (jqxhr, status, err) {
        $('#msg').append('<br>' + status + ', ' + err);
        login = false;
    });
    return login;
}
function check_password(frm, success_todo, unsuccess_todo) {
    $.ajax({
        type: 'POST',
        async: true,
        timeout: 100000,
        url: backendUrl + "addon/password/check/",
        data: frm.serialize(),
        dataType: 'json',
        headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
        beforeSend: function () {
        }
    }).done(function (json) {
        if (json.not_authenticated) {
            ask_login(); //a uniform name
        }
        else {
            $('#msg').html(json.message).fadeIn(300).delay(700).fadeOut(200);
            if (json.success) {
                success_todo(json);
            }
            else {
                unsuccess_todo(json);
            }
        }
    }).error(function (jqxhr, status, err) {
        $('#msg').append('<br>' + status + ', ' + err);
    });
}
function change_password(frm, success_todo, unsuccess_todo) {
    $.ajax({
        type: 'POST',
        async: true,
        timeout: 100000,
        url: backendUrl + "addon/password/change/",
        data: frm.serialize(),
        dataType: 'json',
        headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
        beforeSend: function () {
        }
    }).done(function (json) {
        if (json.success) {
            success_todo(json);
        }
        else {
            unsuccess_todo(json);
        }
    })
    .error(function (jqxhr, status, err) {
        $('#msg').append('<br>' + status + ', ' + err);
    });
}

var bwList = {
    clean_list: function (list) {
        try {
            list = list.filter(function (e, i, a) {
                return ($.trim(e) == "") ? false : true;
            });
        }
        catch (e) {}

        try {
            list = list.map(function (e) {
                var p = new bg.cloudaclWebFilter.URLParser(e);
                return p.getHost();
            });
        }
        catch (e) {}
        list = $.unique(list).sort();
        return list;
    },
    getRawJson: function () {
        return JSON.stringify(bg.cloudaclWebFilter.getBlackWhiteList());
    },
    getRawList: function () {
        return bg.cloudaclWebFilter.getBlackWhiteList();
    },
    saveRawList: function (bwlist) {
        bg.cloudaclWebFilter.setBlackWhiteList(bwlist);
        bg.cloudaclWebFilter.clearUrlCache();
    },
    getList: function () {
        var bwl = bg.cloudaclWebFilter.getBlackWhiteList();
        var bl = [];
        var wl = [];
        for (var n in bwl) {
            if (bwl[n] == 100) {
                bl.push(bg.cloudaclWebFilter.urlNormorlize(n));
            }
            else if (bwl[n] == 101) {
                wl.push(bg.cloudaclWebFilter.urlNormorlize(n));
            }
        }
        return { blacklist: this.clean_list(bl), whitelist: this.clean_list(wl) };
    },
    saveBlackList: function (blist) {
        bg.cloudaclWebFilter.clearBlackList();
        for (var i in blist) {
            var url = $.trim(blist[i]);
            if (url != "") {
                bg.cloudaclWebFilter.addSite2BlackList(url);
            }
        }
        bg.syncHelper.save();
    },
    saveWhiteList: function (wlist) {
        bg.cloudaclWebFilter.clearWhiteList();
        for (var i in wlist) {
            var url = $.trim(wlist[i]);
            if (url != "") {
                bg.cloudaclWebFilter.addSite2WhiteList(url);
            }
        }
        bg.syncHelper.save();
    }
}

function ajax_get(path, success_todo, unsuccess_todo, not_authenticated_todo) {
    $.ajax({
        type: 'GET',
        async: true,
        timeout: 5000,
        url: backendUrl + path,
        dataType: 'json',
        headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
        success: function (json) {
            if (json.not_authenticated) {
                if (not_authenticated_todo) {
                    not_authenticated_todo(json);
                }
            }
            else {
                if (json.success) {
                    if (success_todo) {
                        success_todo(json);
                    }
                }
                else {
                    if (unsuccess_todo) {
                        unsuccess_todo(json);
                    }
                }
            }
        }
    }).error(function (jqxhr, status, err) {
    });
}

function ajax_post(path, data, success_todo, unsuccess_todo, not_authenticated_todo) {
    $.ajax({
        type: 'POST',
        async: true,
        timeout: 100000,
        url: backendUrl + path,
        data: data,
        dataType: 'json',
        headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
        beforeSend: function () {
        }
    }).done(function (json) {
        if (json.not_authenticated) {
            if (not_authenticated_todo) {
                not_authenticated_todo(json);
            }
        }
        else {
            if (json.success) {
                if (success_todo) {
                    success_todo(json);
                }
            }
            else {
                if (unsuccess_todo) {
                    unsuccess_todo(json);
                }
            }
        }
    }).error(function (jqxhr, status, err) {
    });
}