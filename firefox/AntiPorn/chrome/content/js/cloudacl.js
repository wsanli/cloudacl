(function (window, undefined) {
    var cloudacl = (function () {
        "use strict";

        var r20 = /%20/g;
        var trimLeft = /^\s+/;
        var trimRight = /\s+$/;
        var sortOrder;
        var hasDuplicate = false, baseHasDuplicate = true;

        var jx = {
            buildParams: function (prefix, obj, add) {
                add(prefix, obj);
            },
            param: function (a) {
                var s = [], add = function (key, value) {
                    s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
                };

                for (var prefix in a) {
                    this.buildParams(prefix, a[prefix], add);
                }

                return s.join("&").replace(r20, "+");
            },
            getHTTPObject: function () {
                var http = false;
                if (window.XMLHttpRequest) {
                    try {
                        http = new XMLHttpRequest();
                    } catch (e) {
                        http = false;
                    }
                }
                return http;
            },
            load: function (type, url, success, error, format, timeout, data) {
                var http = this.init(); //The XMLHttpRequest object is recreated at every call - to defeat Cache problem in IE
                if (!http || !url) { return; }
                if (http.overrideMimeType) { http.overrideMimeType('text/plain'); }

                if (!format) {
                    format = "text"; //Default return type is 'text'
                }
                format = format.toLowerCase();

                if (timeout) {
                    http.timeout = timeout;
                }
                else {
                    http.timeout = 5000;
                }
                if (error) {
                    http.ontimeout = error;
                }

                type = (type) ? type : "GET";
                var now = "jxuid=" + new Date().getTime();
                url += (url.indexOf("?") + 1) ? "&" : "?";
                url += now;

                http.open(type, url, true);

                http.setRequestHeader("HTTP_X_REQUESTED_WITH", "XMLHttpRequest");
                http.setRequestHeader("X_REQUESTED_WITH", "XMLHttpRequest");
                http.setRequestHeader("X-Requested-With", "XMLHttpRequest");

                var data_string = null;
                if (type.toLowerCase() === "post") {
                    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    if (typeof data !== "string") {
                        data_string = this.param(data);
                    }
                    else {
                        data_string = data;
                    }
                }

                http.onreadystatechange = function () { //Call a function when the state changes.
                    if (http.readyState == 4) { //Ready State will be 4 when the document is loaded.
                        if (http.status == 200) {
                            var result = "";
                            if (http.responseText) { result = http.responseText; }

                            if (format.charAt(0) == "j") {
                                result = result.replace(/[\n\r]/g, "");
                                result = JSON.parse(result);
                            }

                            if (success) { success(result); }
                        } else { //An error occured
                            if (error) {
                                error(http, http.status, http.statusText);
                            }
                        }
                    }
                };
                http.send(data_string);
            },
            init: function () {
                return this.getHTTPObject();
            }
        };

        return {
            jQ: {
                ajax: function (options) {
                    options = options || {};
                    var type = (options["type"] !== undefined) ? options["type"] : "GET";
                    var url = (options["url"] !== undefined) ? options["url"] : "";
                    if (url === "") { return; }
                    var timeout = (options["timeout"] !== undefined) ? options["timeout"] : 5000;
                    var success = (options["success"] !== undefined) ? options["success"] : null;
                    var error = (options["error"] !== undefined) ? options["error"] : null;
                    var data = (type.toLowerCase() === "post" && options["data"] !== undefined) ? options["data"] : null;
                    jx.load(type, url, success, error, "json", timeout, data);
                },
                trim: window.trim ? function (text) {
                    return text === null ? "" : window.trim.call(text);
                } : function (text) {
                    return text === null ? "" : text.toString().replace(trimLeft, "").replace(trimRight, "");
                },
                unique: function (results) {
                    if (sortOrder) {
                        hasDuplicate = baseHasDuplicate;
                        results.sort(sortOrder);

                        if (hasDuplicate) {
                            for (var i = 1; i < results.length; i++) {
                                if (results[i] === results[i - 1]) {
                                    results.splice(i--, 1);
                                }
                            }
                        }
                    }
                    return results;
                }
            }
        }

    })();
    if (!window.cloudacl) {
        window.cloudacl = cloudacl;
    }
})(window);
