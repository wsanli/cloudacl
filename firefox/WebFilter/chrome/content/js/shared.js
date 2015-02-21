(function ($) {
    "use strict";

    //// cloudacl shared ////
    $.cloudacl_shared = {
        backendUrl: "http://www.cloudacl.com/",
        msgbox: '',
        prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.cloudaclwebfilter."),
        log: function (s) {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage('DEBUG --- ' + s);
        },
        URLParser: (function () {
            var _fields = {
                'Username': 4,
                'Password': 5,
                'Port': 7,
                'Protocol': 2,
                'Host': 6,
                'Pathname': 8,
                'URL': 0,
                'Querystring': 9,
                'Fragment': 10
            };
            var _values = {};
            var _regex = /^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/;

            var _initValues = function () {

                var f;
                for (f in _fields) {
                    _values[f] = '';
                }
            };
            var _parse = function (url) {

                var r = _regex.exec(url);

                _initValues();
                if (!r) { throw "DPURLParser::_parse -> Invalid URL"; }

                for (var f in _fields) {
                    if (typeof r[_fields[f]] !== 'undefined') {
                        _values[f] = r[_fields[f]];
                    }
                }
            };
            var _makeGetter = function (field) {
                return function () {
                    return _values[field];
                };
            };

            var ctor = function (url) {

                this.setURL = function (url) {
                    _parse(url);
                };

                for (var f in _fields) {
                    this['get' + f] = _makeGetter(f);
                }

                if (typeof url !== 'undefined') {
                    _parse(url);
                }

            };
            return ctor;
        })(),

        setPref: function (name, val) {
            var _this = this;
            if (typeof (val) === 'boolean') {
                _this.prefs.setBoolPref(name, val);
            }
            else if (typeof (val) === 'string') {
                _this.prefs.setCharPref(name, val);
            }
            else if (typeof (val) === 'number') {
                _this.prefs.setIntPref(name, val);
            }
        },
        getPref: function (name) {
            var _this = this;
            var rtn;

            var type = _this.prefs.getPrefType(name);

            if (type === _this.prefs.PREF_BOOL) {
                rtn = _this.prefs.getBoolPref(name);
            }
            else if (type === _this.prefs.PREF_STRING) {
                rtn = _this.prefs.getCharPref(name);
            }
            else if (type === _this.prefs.PREF_INT) {
                rtn = _this.prefs.getIntPref(name);
            }

            return rtn;
        },
        msg: function (data, color, time) {
            var _this = this;
            if (!time) {
                time = 700;
            }
            _this.msgbox.html(data).css('color', color);
            _this.msgbox.show();
            setTimeout(function () {
                _this.msgbox.hide();
            }, time);
        },
        check_password_enabled: function () {
            var _this = this;
            if (_this.getPref('pass_enabled') === 'true') {
                return true;
            }
            else {
                return false;
            }
        },
        hasLocalEmail: function () {
            var _this = this;
            try {
                if (_this.getPref('email') && _this.getPref('email').length > 0) {
                    return _this.getPref('email');
                }
                return false;
            }
            catch (e) {
                return false;
            }
            return false;
        },
        afterLoginShow: function () {
            var _this = this;
            /// check login, if not, show signup, if so, show login///
            return function () {
                var email = _this.hasLocalEmail();
                if (email) {
                    document.getElementById("id_username").value = email;
                }
            };
        }
    };

})(cloudacl);