(function ($) {
    "use strict";

    $.ajaxHelper = {
        log: function (s) {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage('DEBUG --- ' + s);
        },
        backendUrl: "http://www.cloudacl.com/",
        ajax_get: function (path, success_todo, unsuccess_todo, not_authenticated_todo) {
            var _this = this;
            $.jQ.ajax({
                type: 'GET',
                url: _this.backendUrl + path,
                timeout: 5000,
                success: function (json) {
                    if (json.not_authenticated) {
                        if (not_authenticated_todo) {
                            not_authenticated_todo(json);
                        }
                    } else {
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
                },
                error: function (jqxhr, status, err) {
                }
            });
        },
        ajax_post: function (path, data, success_todo, unsuccess_todo, not_authenticated_todo) {
            var _this = this;
            $.jQ.ajax({
                type: 'POST',
                url: _this.backendUrl + path,
                timeout: 100000,
                data: data,
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
                },
                error: function (jqxhr, status, err) {
                }
            });
        }
    };

    $.bwListHelper = {
        prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.cloudaclantiporn."),
        log: function (s) {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage('DEBUG --- ' + s);
        },
        urlNormorlize: function (url) {
            var site = url.toLowerCase();
            return site.toLowerCase().replace(/^www\./gi, "");
        },
        getBlackWhiteList: function () {
            var bw = null;
            try {
                bw = this.prefs.getCharPref("cloudaclBlackWhiteList");
            } catch (e) {
            }
            return bw ? JSON.parse(bw) : {};
        },
        setBlackWhiteList: function (bwList) {
            this.prefs.setCharPref("cloudaclBlackWhiteList", JSON.stringify(bwList));
        },
        addSite2BWList: function (site, cid) {
            var site2 = this.urlNormorlize(site);
            var bwList = this.getBlackWhiteList();
            bwList[site2] = cid;
            this.setBlackWhiteList(bwList);
        },
        addSite2BlackList: function (site) {
            this.addSite2BWList(site, 100);
        },
        addSite2WhiteList: function (site) {
            this.addSite2BWList(site, 101);
        },
        getRawJson: function () {
            return JSON.stringify(this.getBlackWhiteList());
        },
        getRawList: function () {
            return this.getBlackWhiteList();
        },
        saveRawList: function (bwlist) {
            this.setBlackWhiteList(bwlist);
        },
        clean_list: function (list) {
            try {
                list = list.filter(function (ele, i, a) {
                    return ($.jQ.trim(ele) === "") ? false : true;
                });

                list = list.map(function (ele) {
                    var p = new $.cloudacl_shared.URLParser(ele);
                    return p.getHost();
                });
            }
            catch (e) {
            }
            list = $.jQ.unique(list).sort();
            return list;
        },
        getList: function () {
            var bwl = this.getBlackWhiteList();
            var bl = [];
            var wl = [];
            var n;
            for (n in bwl) {
                if (bwl[n] === 100) {
                    bl.push(this.urlNormorlize(n));
                }
                else if (bwl[n] === 101) {
                    wl.push(this.urlNormorlize(n));
                }
            }
            return { blacklist: this.clean_list(bl), whitelist: this.clean_list(wl) };
        },
        clearBlackList: function () {
            var bwList = this.getBlackWhiteList();
            var site;
            for (site in bwList) {
                if (bwList[site] === 100) {
                    delete bwList[site];
                }
            }
            this.setBlackWhiteList(bwList);
        },
        clearWhiteList: function () {
            var bwList = this.getBlackWhiteList();
            var site;
            for (site in bwList) {
                if (bwList[site] === 101) {
                    delete bwList[site];
                }
            }
            this.setBlackWhiteList(bwList);
        },
        saveBlackList: function (blist) {
            this.clearBlackList();
            var bwList = this.getBlackWhiteList();
            for (var i in blist) {
                var url = $.jQ.trim(blist[i]);
                if (url !== "") {
                    var site2 = this.urlNormorlize(url);
                    bwList[site2] = 100;
                }
            }
            this.setBlackWhiteList(bwList);

            $.syncHelper.save();
        },
        saveWhiteList: function (wlist) {
            this.clearWhiteList();
            var bwList = this.getBlackWhiteList();
            for (var i in wlist) {
                var url = $.jQ.trim(wlist[i]);
                if (url !== "") {
                    var site2 = this.urlNormorlize(url);
                    bwList[site2] = 101;
                }
            }
            this.setBlackWhiteList(bwList);

            $.syncHelper.save();
        }
    };

    $.syncHelper = (function () {
        var pollInterval = 5 * 60 * 1000;  //5 min
        var first_sync;
        var callBack;

        (function init() {
            first_sync = ($.cloudacl_shared.getPref('bwlist_sync')) ? false : true;
            callBack = null;
        })();
        return {
            log: function (s) {
                var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
                consoleService.logStringMessage('DEBUG --- ' + s);
            },
            setCallBack: function (fn) {
                callBack = fn;
            },
            setFirst: function () {
                first_sync = true;
            },
            getUpdatedTime: function () {
                var timestamp = parseInt($.cloudacl_shared.getPref('updated_time'), 10);
                return isNaN(timestamp) ? 0 : timestamp;
            },
            saveUpdatedTime: function (updated_time) {
                $.cloudacl_shared.setPref('updated_time', updated_time);
            },
            getEnable: function () {
                return ($.cloudacl_shared.getPref('bwlist_sync')) ? true : false;
            },
            setEnable: function (enabled) {
                $.cloudacl_shared.setPref('bwlist_sync', enabled);
            },
            merge_obj: function (obj1, obj2) {
                var obj3 = {}, attrname;
                for (attrname in obj1) { obj3[attrname] = obj1[attrname]; }
                for (attrname in obj2) { obj3[attrname] = obj2[attrname]; }
                return obj3;
            },
            merge: function () {
                var _this = this;
                $.ajaxHelper.ajax_get("addon/getbwlist/",
                        function (json) {

                            var locallist = $.bwListHelper.getRawList();
                            var serverlist = json.list;
                            var merged_list = _this.merge_obj(serverlist, locallist);

                            $.bwListHelper.saveRawList(merged_list);

                            _this.save();
                        },
                        function (json) {
                            _this.save();
                        });
            },
            sync: function () {
                var _this = this;
                if (first_sync) {
                    this.merge();
                    first_sync = false;
                }
                else {

                    try {
                        $.ajaxHelper.ajax_get("addon/checkbwlist/",
                function (json) {
                    $.ajaxHelper.ajax_get("addon/getbwlist/",
                        function (json) {
                            if (_this.getUpdatedTime() < json.updatetime) {

                                $.bwListHelper.saveRawList(json.list);

                                _this.saveUpdatedTime(json.updatetime);
                            }
                        },
                        function (json) {
                        });
                },
                function (json) {
                    _this.save();
                });
                    }
                    catch (e) {
                    }
                }
            },
            save: function () {
                var _this = this;
                if (this.getEnable()) {
                    $.ajaxHelper.ajax_post("addon/savebwlist/", { 'data': $.bwListHelper.getRawJson() },
                function (json) {
                    _this.saveUpdatedTime(json.updatetime);

                    if (callBack) {
                        callBack();
                        callBack = null;
                    }
                },
                function (json) {
                });
                }
            },
            schedule_sync: function (startInterval) {
                var _this = this;
                if (this.getEnable()) {
                    if (startInterval !== null) {
                        setTimeout(function () { _this.sync(); }, startInterval);
                    } else {
                        setTimeout(function () { _this.sync(); }, 0);
                    }
                    setTimeout(function () { _this.schedule_sync(); }, pollInterval);
                }
            }
        };
    })();

    $.alertHelper = {
        send_alert: function (host, cid, rawUrl, addonName) {
            try {
                $.ajaxHelper.ajax_post("addon/sendalert/", { 'host': host, 'cid': cid, 'rawUrl': rawUrl, 'addonName': addonName },
                function (json) {
                },
                function (json) {
                });
            }
            catch (e) {
            }
        }
    };

})(cloudacl);