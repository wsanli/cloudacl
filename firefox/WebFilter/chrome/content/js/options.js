jQuery.noConflict();
(function ($) {
    "use strict";
    var option = {
        prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.cloudaclwebfilter."),
        log: function (s) {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage('DEBUG --- ' + s);
        },
        PrefObserver: {
            register: function () {
                var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
                this._branch = prefService.getBranch("extensions.cloudaclwebfilter.");
                this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
                this._branch.addObserver("", this, false);
            },
            log: function (s) {
                var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
                consoleService.logStringMessage('DEBUG --- ' + s);
            },
            unregister: function () {
                if (!this._branch) { return; }
                this._branch.removeObserver("", this);
            },
            observe: function (aSubject, aTopic, aData) {
                if (aTopic !== "nsPref:changed") { return; }
                if (aData === "cloudaclBlackWhiteList") {
                }
            }
        },

        saving: null,

        login: function (frm, success_todo, unsuccess_todo) {
            var query_url = cloudacl.cloudacl_shared.backendUrl + "addon/login/";
            $.ajax({
                type: 'POST',
                async: true,
                timeout: 1000,
                url: query_url,
                data: frm.serialize(),
                dataType: 'json',
                headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
                beforeSend: function () {
                }
            }).done(function (json) {
                if (json.success) {
                    cloudacl.cloudacl_shared.setPref('email', frm.find("#id_username").val());
                    success_todo(json);
                }
                else {
                    unsuccess_todo(json);
                }
            }).error(function (jqxhr, status, err) {
                cloudacl.cloudacl_shared.msgbox.append('<br>' + status + ', ' + err);
            });
        },
        logout: function (todo) {
            if (window.confirm("Are you sure to sign out?")) {
                $.ajax({
                    type: 'GET',
                    async: true,
                    timeout: 100000,
                    url: cloudacl.cloudacl_shared.backendUrl + "addon/logout/",
                    dataType: 'html',
                    headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
                    success: function (data) {
                        cloudacl.cloudacl_shared.msgbox.html(data).fadeIn(300).delay(700).fadeOut(200);
                        todo();
                    }
                }).error(function (jqxhr, status, err) {
                    cloudacl.cloudacl_shared.msgbox.append('<br>' + status + ', ' + err);
                });
                return true;
            }
            else {
                return false;
            }
        },
        check_login: function (success_todo) {
            $.ajax({
                type: 'GET',
                async: true,
                timeout: 5000,
                url: cloudacl.cloudacl_shared.backendUrl + "addon/checklogin/",
                dataType: 'json',
                headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
                success: function (json) {
                    if (json.not_authenticated) {
                        success_todo(false);
                    }
                    else {
                        success_todo(true);
                    }
                }
            }).error(function (jqxhr, status, err) {
                cloudacl.cloudacl_shared.msgbox.append('<br>' + status + ', ' + err);
                success_todo(false);
            });
        },
        check_password: function (frm, success_todo, unsuccess_todo, ask_login_todo) {
            $.ajax({
                type: 'POST',
                async: true,
                timeout: 100000,
                url: cloudacl.cloudacl_shared.backendUrl + "addon/password/check/",
                data: frm.serialize(),
                dataType: 'json',
                headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
                beforeSend: function () {
                }
            }).done(function (json) {
                if (json.not_authenticated) {
                    ask_login_todo(); //a uniform name
                }
                else {
                    cloudacl.cloudacl_shared.msgbox.html(json.message).fadeIn(300).delay(700).fadeOut(200);
                    if (json.success) {
                        success_todo(json);
                    }
                    else {
                        unsuccess_todo(json);
                    }
                }
            }).error(function (jqxhr, status, err) {
                cloudacl.cloudacl_shared.msgbox.append('<br>' + status + ', ' + err);
            });
        },
        change_password: function (frm, success_todo, unsuccess_todo) {
            $.ajax({
                type: 'POST',
                async: true,
                timeout: 100000,
                url: cloudacl.cloudacl_shared.backendUrl + "addon/password/change/",
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
            }).error(function (jqxhr, status, err) {
                cloudacl.cloudacl_shared.msgbox.append('<br>' + status + ', ' + err);
            });
        },

        initialize: function () {
            var _this = this;
            _this.initUI();
            _this.initVars();
            _this.initEvents();
            _this.initButtons();
            _this.initForms();
            _this.initSettings();
            _this.loadOptions();
            _this.loadAlertOptions();
            _this.loadBLWL();
        },
        initUI: function () {
            $("ul.tabs").tabs("div.panes > div", { "initialIndex": 0 });
        },
        initVars: function () {
            this.saving = $("#saving");
            cloudacl.cloudacl_shared.msgbox = $('#msg');
        },
        initEvents: function () {
            $("#loading").bind("ajaxSend", function () {
                $(this).show();
            }).bind("ajaxComplete", function () {
                $(this).hide();
            });
        },
        init_button_need_login: function (e) {
            var _this = this;
            return function (e) {

                _this.saveSettings();

                var $checkbox = $(this);
                var enabled = $checkbox.prop("checked");
                if (enabled) {
                    cloudacl.cloudacl_shared.msg($checkbox.data('enable_msg'), 'green', 2500);
                    _this.check_login(function (is_login) {
                        if (!is_login) {
                            _this.ask_login();
                        } else {
                            _this.hide_login();
                        }
                    });
                } else {
                    cloudacl.cloudacl_shared.msg($checkbox.data('disable_msg'), 'green', 2500);
                    _this.hide_login();
                }

            };
        },
        initButtons: function () {
            var _this = this;

            $('#lnkRegister').prop("href", cloudacl.cloudacl_shared.backendUrl + "accounts/register/");

            $("#enable_password").data('enable_msg', 'You ENABLED password protection');
            $("#enable_password").data('disable_msg', 'You DISABLED password protection');
            $("#enable_password").change(_this.init_button_need_login());

            $("#bwlist_sync").data('enable_msg', 'You ENABLED sync black/white list');
            $("#bwlist_sync").data('disable_msg', 'You DISABLED sync black/white list');
            $("#bwlist_sync").change(_this.init_button_need_login());
            $("#bwlist_sync").change(function () {
                if ($(this).prop("checked")) {
                    cloudacl.syncHelper.setCallBack(function () {
                        _this.loadBLWL();
                    });
                    cloudacl.syncHelper.setFirst();
                    cloudacl.syncHelper.schedule_sync(1000);
                }
            });

            $("#btnChangePassword").click(function () {
                $("#change-password").toggle();
            });
            $("#btnChangePasswordCancel").click(function () {
                $("#change-password").hide();
            });
            $("#btnToParent").click(function () {
                cloudacl.cloudacl_shared.setPref("parent_mode", true);
                _this.initSettings();
            });
            $("#btnToKid").click(function () {
                cloudacl.cloudacl_shared.setPref("parent_mode", false);
                cloudacl.cloudacl_shared.setPref("bg_verified", false);
                _this.initSettings();
            });

            $("#policy").find("input").change(function () {
                _this.saveSettings();
            });

            $("#alert_email").data('enable_msg', 'You ENABLED Email Alert');
            $("#alert_email").data('disable_msg', 'You DISABLED Email Alert');
            $("#alert_sms").data('enable_msg', 'You ENABLED SMS Alert');
            $("#alert_sms").data('disable_msg', 'You DISABLED SMS Alert');
            $("#alert").find("input").change(_this.init_button_need_login());

            $("#enable_toolbar").change(function () {
                var show = $(this).is(':checked');
                cloudacl.cloudacl_shared.setPref("enable_toolbar", show);
                if(show){
                    alert("Please close and reopen firefox to see the change.");
                }
                else{
                    alert("Please close and reopen firefox to see the change. \r\n\r\nYou can always open this options page from 'Tools > WebFilter Security Policy'");
                }
            });
        },
        initForms: function () {
            var _this = this;
            $('.error').hide();

            $("#frmLogin").submit(function () {
                _this.login($(this), function (json) {
                    cloudacl.cloudacl_shared.msg(json.message, 'green');
                    cloudacl.cloudacl_shared.setPref("bg_verified", true);
                    $("#id_password").val('');
                    _this.initSettings();
                }, function (json) {
                    cloudacl.cloudacl_shared.msg(json.message, 'red');
                });
                return false;
            });
            $("#frmCheckpass").submit(function () {
                _this.check_password($(this), function (json) {
                    cloudacl.cloudacl_shared.msg(json.message, 'green');
                    cloudacl.cloudacl_shared.setPref("bg_verified", true);
                    $("#rawpass").val('');
                    _this.initSettings();
                },
            function (json) {
                cloudacl.cloudacl_shared.msg(json.message, 'red');
                cloudacl.cloudacl_shared.setPref("bg_verified", false);
                _this.initSettings();
            },
            _this.ask_login
            );
                return false;
            });

            $("#frmChangePassword").submit(function () {
                _this.change_password($(this),
            function (json) {
                cloudacl.cloudacl_shared.msg(json.message, 'green');
                $("#change-password").hide();
            },
            function (json) {
                cloudacl.cloudacl_shared.msg(json.message, 'red');
            });
                return false;
            });
        },
        initSettings: function () {
            var _this = this;

            $('#login').hide();
            var pass_enabled = cloudacl.cloudacl_shared.getPref('pass_enabled');

            if (pass_enabled) {
                $('#enable_password').prop("checked", true);
            }
            else {
                $('#enable_password').prop("checked", false);
            }

            var parent_mode = cloudacl.cloudacl_shared.getPref("parent_mode");
            var bg_verified = cloudacl.cloudacl_shared.getPref("bg_verified");

            _this.check_login(
                   function (is_login) {

                       if (is_login) {
                           $("#btnChangePassword").show();
                       }
                       else {
                           $("#btnChangePassword").hide();
                       }

                       if (pass_enabled && !bg_verified) {
                           if (!is_login) {
                               _this.ask_login();
                           }
                       }
                   }
                );

            if (pass_enabled && !bg_verified) {

                $('#checkpass').show();

                $('#config').hide();
                $('#password_setting').hide();
                $('#mode').hide();
                $('#alert').hide();
                $('#option').hide();
                $('#buttons').hide();

            }
            else {
                $('#checkpass').hide();

                $('#config').show();
                $('#password_setting').show();
                $('#mode').show();

                if (parent_mode) {
                    $('#btnToParent').attr('checked', true);
                } else {
                    $('#btnToKid').attr('checked', true);
                }

                $('#alert').show();
                $('#option').show();
                $('#buttons').show();
            }

            $('#alert_email').prop("checked", cloudacl.cloudacl_shared.getPref('alert_email'));
            $('#alert_sms').prop("checked", cloudacl.cloudacl_shared.getPref('alert_sms'));
            $('#bwlist_sync').prop("checked", cloudacl.cloudacl_shared.getPref('bwlist_sync'));
            $('#enable_toolbar').prop("checked", cloudacl.cloudacl_shared.getPref('enable_toolbar'));

        },
        ask_login: function () {
            $('#checkpass').hide();
            $('#login').show(cloudacl.cloudacl_shared.afterLoginShow());
            $("#id_password").val('');
        },
        hide_login: function () {
            $('#checkpass').hide();
            $('#login').hide();
        },
        saveSettings: function () {
            var _this = this;
            _this.saving.show();

            cloudacl.cloudacl_shared.setPref("pass_enabled", $('#enable_password').prop("checked") ? true : false);
            cloudacl.cloudacl_shared.setPref("alert_email", $('#alert_email').prop("checked") ? true : false);
            cloudacl.cloudacl_shared.setPref("alert_sms", $('#alert_sms').prop("checked") ? true : false);
            cloudacl.cloudacl_shared.setPref("bwlist_sync", $('#bwlist_sync').prop("checked") ? true : false);
            _this.saveOptions();
            _this.saveAlertOptions();

            setTimeout(function () {
                _this.saving.hide();
            }, 800);
        },
        /// for alert ///
        saveAlertOptions: function () {
            var i = 1;
            for (; i <= 9; i += 1) {
                var cid_name = "cid" + i + "alert";
                var cid_ctrl = document.getElementById(cid_name);
                cloudacl.cloudacl_shared.setPref(cid_name, cid_ctrl.checked ? true : false);
            }
            /*
            chrome.extension.sendRequest({ request: "saveAlertOption" });
            */
        },
        loadAlertOptions: function () {
            var i = 1;
            for (; i <= 9; i++) {
                var cid_name = "cid" + i + "alert";
                var cid_ctrl = document.getElementById(cid_name);
                cid_ctrl.checked = cloudacl.cloudacl_shared.getPref(cid_name);
            }
        },
        /// for category ///
        saveOptions: function () {
            var i = 1;
            for (; i <= 9; i++) {
                var cid_name = "cid" + i + "pref";
                var cid_ctrl = document.getElementById(cid_name);
                cloudacl.cloudacl_shared.setPref(cid_name, cid_ctrl.checked ? true : false);
            }
            /*
            chrome.extension.sendRequest({ request: "saveOption" });
            */
        },
        loadOptions: function () {
            var i = 1;
            for (; i <= 9; i++) {
                var cid_name = "cid" + i + "pref";
                var cid_ctrl = document.getElementById(cid_name);
                cid_ctrl.checked = cloudacl.cloudacl_shared.prefs.getBoolPref(cid_name);
            }
        },
        selectAll: function (isSelectAll) {
            var i = 1;
            for (; i <= 9; i++) {
                var cid_name = "cid" + i + "pref";
                var cid_ctrl = document.getElementById(cid_name);
                cid_ctrl.checked = isSelectAll ? true : false;
            }
        },
        loadBLWL: function () {
            var _this = this;
            var bwl = cloudacl.bwListHelper.getList();

            //load text view
            var bltext = $("#bltext");
            var wltext = $("#wltext");
            bltext.text(bwl.blacklist.join('\n'));
            wltext.text(bwl.whitelist.join('\n'));

            //load list view
            var bl = $.fn.urllist("#bl", { list: bwl.blacklist, width: 560, delWidth: 75 });
            var wl = $.fn.urllist("#wl", { list: bwl.whitelist, width: 560, delWidth: 75 });

            //save buttons
            $("#btnSaveBL").click(function () {
                try {
                    _this.saving.show();

                    var blist = [];
                    if (bltext.is(":visible")) {
                        blist = $.trim(bltext.val()).split('\n');
                    }
                    else if (bl.is(":visible")) {
                        blist = bl.getlist();
                    }

                    blist = cloudacl.bwListHelper.clean_list(blist);

                    cloudacl.bwListHelper.saveBlackList(blist);
                    bltext.text(blist.join('\n'));
                    bl.loadlist(blist);

                    setTimeout(function () {
                        _this.saving.hide();
                    }, 600);
                } catch (e) {
                }
            });
            $("#btnSaveWL").click(function () {
                try {
                    _this.saving.show();

                    var wlist = [];
                    if (wltext.is(":visible")) {
                        wlist = $.trim(wltext.val()).split('\n');
                    }
                    else if (wl.is(":visible")) {
                        wlist = wl.getlist();
                    }

                    wlist = cloudacl.bwListHelper.clean_list(wlist);

                    cloudacl.bwListHelper.saveWhiteList(wlist);
                    wltext.text(wlist.join('\n'));
                    wl.loadlist(wlist);

                    setTimeout(function () {
                        _this.saving.hide();
                    }, 600);
                } catch (e) {
                }
            });

            ///view switch
            $("#blsw").dualtoggle("#bltext", "#bllist", { init: 1, Text: ["List View", "Text View"] });
            $("#wlsw").dualtoggle("#wltext", "#wllist", { init: 1, Text: ["List View", "Text View"] });
        }
    };
    $(document).ready(function () {
        try {
            option.initialize();
        }
        catch (e) {
        }
    });
    $(window).unload(function() {
        cloudacl.cloudacl_shared.setPref("bg_verified", false);
    });
})(jQuery);

