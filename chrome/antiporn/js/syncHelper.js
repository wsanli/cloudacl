
var syncHelper = (function () {
    var pollInterval = 10 * 60 * 1000;  //10 min
    var first_sync;
    var callBack;

    (function init() {
        first_sync = (!localStorage['bwlist_sync'] || localStorage['bwlist_sync'] == 'false') ? true : false;
        callBack = null;
    })();

    return {
        setCallBack: function (fn) {
            callBack = fn;
        },
        setFirst: function () {
            first_sync = true;
        },
        getUpdatedTime: function () {
            var timestamp = parseInt(localStorage['updated_time']);
            return isNaN(timestamp) ? 0 : timestamp;
        },
        saveUpdatedTime: function (updated_time) {
            localStorage['updated_time'] = updated_time;
        },
        getEnable: function () {
            return (localStorage['bwlist_sync'] == 'true') ? true : false;
        },
        setEnable: function (enabled) {
            localStorage['bwlist_sync'] = enabled;
        },
        merge_obj: function (obj1, obj2) {
            var obj3 = {};
            for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
            for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
            return obj3;
        },
        merge: function () {
            var _this = this;
            ajax_get("addon/getbwlist/",
                        function (json) {

                            var locallist = bwList.getRawList();
                            var serverlist = json.list
                            var merged_list = _this.merge_obj(serverlist, locallist);

                            bwList.saveRawList(merged_list);

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

                ajax_get("addon/checkbwlist/",
                function (json) {
                    ajax_get("addon/getbwlist/",
                        function (json) {
                            if (_this.getUpdatedTime() < json.updatetime) {

                                bwList.saveRawList(json.list);

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
        },
        save: function () {
            var _this = this;
            if (this.getEnable()) {
                ajax_post("addon/savebwlist/", { 'data': bwList.getRawJson() },
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
            if (this.getEnable()) {
                if (startInterval != null) {
                    window.setTimeout(this.sync.bind(this), startInterval);
                } else {
                    window.setTimeout(this.sync.bind(this), 0);
                }
                window.setTimeout(this.schedule_sync.bind(this), pollInterval);
            }
        }
    }
})();

syncHelper.schedule_sync(1000);
