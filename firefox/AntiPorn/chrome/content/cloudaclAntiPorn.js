var cloudaclAntiPorn = (function () {
    "use strict";

    return {
        Hashtable: (function () {
            var FUNCTION = "function";
            var arrayRemoveAt = (FUNCTION == typeof Array.prototype.splice) ?
            function (arr, idx) {
                arr.splice(idx, 1);
            } :

            function (arr, idx) {
                var itemsAfterDeleted, i, len;
                if (idx === arr.length - 1) {
                    arr.length = idx;
                } else {
                    itemsAfterDeleted = arr.slice(idx + 1);
                    arr.length = idx;
                    for (i = 0, len = itemsAfterDeleted.length; i < len; i += 1) {
                        arr[idx + i] = itemsAfterDeleted[i];
                    }
                }
            };

            function hashObject(obj) {
                var hashCode;
                if (typeof obj === "string") {
                    return obj;
                } else if (typeof obj.hashCode == FUNCTION) {
                    hashCode = obj.hashCode();
                    return (typeof hashCode == "string") ? hashCode : hashObject(hashCode);
                } else if (typeof obj.toString == FUNCTION) {
                    return obj.toString();
                } else {
                    try {
                        return String(obj);
                    } catch (ex) {
                        return Object.prototype.toString.call(obj);
                    }
                }
            }

            function equals_fixedValueHasEquals(fixedValue, variableValue) {
                return fixedValue.equals(variableValue);
            }

            function equals_fixedValueNoEquals(fixedValue, variableValue) {
                return (typeof variableValue.equals == FUNCTION) ?
                   variableValue.equals(fixedValue) : (fixedValue === variableValue);
            }

            function createKeyValCheck(kvStr) {
                return function (kv) {
                    if (kv === null) {
                        throw new Error("null is not a valid " + kvStr);
                    } else if (typeof kv == "undefined") {
                        throw new Error(kvStr + " must not be undefined");
                    }
                };
            }

            var checkKey = createKeyValCheck("key"), checkValue = createKeyValCheck("value");

            /*----------------------------------------------------------------------------------------------------------------*/

            function Bucket(hash, firstKey, firstValue, equalityFunction) {
                this[0] = hash;
                this.entries = [];
                this.addEntry(firstKey, firstValue);

                if (equalityFunction !== null) {
                    this.getEqualityFunction = function () {
                        return equalityFunction;
                    };
                }
            }

            var EXISTENCE = 0, ENTRY = 1, ENTRY_INDEX_AND_VALUE = 2;

            function createBucketSearcher(mode) {
                return function (key) {
                    var i = this.entries.length, entry, equals = this.getEqualityFunction(key);
                    while (i--) {
                        entry = this.entries[i];
                        if (equals(key, entry[0])) {
                            switch (mode) {
                                case EXISTENCE:
                                    return true;
                                case ENTRY:
                                    return entry;
                                case ENTRY_INDEX_AND_VALUE:
                                    return [i, entry[1]];
                            }
                        }
                    }
                    return false;
                };
            }

            function createBucketLister(entryProperty) {
                return function (aggregatedArr) {
                    var startIndex = aggregatedArr.length;
                    for (var i = 0, len = this.entries.length; i < len; i += 1) {
                        aggregatedArr[startIndex + i] = this.entries[i][entryProperty];
                    }
                };
            }

            Bucket.prototype = {
                getEqualityFunction: function (searchValue) {
                    return (typeof searchValue.equals == FUNCTION) ? equals_fixedValueHasEquals : equals_fixedValueNoEquals;
                },

                getEntryForKey: createBucketSearcher(ENTRY),

                getEntryAndIndexForKey: createBucketSearcher(ENTRY_INDEX_AND_VALUE),

                removeEntryForKey: function (key) {
                    var result = this.getEntryAndIndexForKey(key);
                    if (result) {
                        arrayRemoveAt(this.entries, result[0]);
                        return result[1];
                    }
                    return null;
                },

                addEntry: function (key, value) {
                    this.entries[this.entries.length] = [key, value];
                },

                keys: createBucketLister(0),

                values: createBucketLister(1),

                getEntries: function (entries) {
                    var startIndex = entries.length;
                    for (var i = 0, len = this.entries.length; i < len; ++i) {
                        entries[startIndex + i] = this.entries[i].slice(0);
                    }
                },

                containsKey: createBucketSearcher(EXISTENCE),

                containsValue: function (value) {
                    var i = this.entries.length;
                    while (i--) {
                        if (value === this.entries[i][1]) {
                            return true;
                        }
                    }
                    return false;
                }
            };

            /*----------------------------------------------------------------------------------------------------------------*/


            function searchBuckets(buckets, hash) {
                var i = buckets.length, bucket;
                while (i--) {
                    bucket = buckets[i];
                    if (hash === bucket[0]) {
                        return i;
                    }
                }
                return null;
            }

            function getBucketForHash(bucketsByHash, hash) {
                var bucket = bucketsByHash[hash];

                return (bucket && (bucket instanceof Bucket)) ? bucket : null;
            }

            /*----------------------------------------------------------------------------------------------------------------*/

            function Hashtable(hashingFunctionParam, equalityFunctionParam) {
                var that = this;
                var buckets = [];
                var bucketsByHash = {};

                var hashingFunction = (typeof hashingFunctionParam == FUNCTION) ? hashingFunctionParam : hashObject;
                var equalityFunction = (typeof equalityFunctionParam == FUNCTION) ? equalityFunctionParam : null;

                this.put = function (key, value) {
                    checkKey(key);
                    checkValue(value);
                    var hash = hashingFunction(key), bucket, bucketEntry, oldValue = null;

                    bucket = getBucketForHash(bucketsByHash, hash);
                    if (bucket) {
                        bucketEntry = bucket.getEntryForKey(key);
                        if (bucketEntry) {
                            oldValue = bucketEntry[1];
                            bucketEntry[1] = value;
                        } else {
                            bucket.addEntry(key, value);
                        }
                    } else {
                        bucket = new Bucket(hash, key, value, equalityFunction);
                        buckets[buckets.length] = bucket;
                        bucketsByHash[hash] = bucket;
                    }
                    return oldValue;
                };

                this.get = function (key) {
                    checkKey(key);

                    var hash = hashingFunction(key);

                    var bucket = getBucketForHash(bucketsByHash, hash);
                    if (bucket) {
                        var bucketEntry = bucket.getEntryForKey(key);
                        if (bucketEntry) {
                            return bucketEntry[1];
                        }
                    }
                    return null;
                };

                this.containsKey = function (key) {
                    checkKey(key);
                    var bucketKey = hashingFunction(key);

                    var bucket = getBucketForHash(bucketsByHash, bucketKey);

                    return bucket ? bucket.containsKey(key) : false;
                };

                this.containsValue = function (value) {
                    checkValue(value);
                    var i = buckets.length;
                    while (i--) {
                        if (buckets[i].containsValue(value)) {
                            return true;
                        }
                    }
                    return false;
                };

                this.clear = function () {
                    buckets.length = 0;
                    bucketsByHash = {};
                };

                this.isEmpty = function () {
                    return !buckets.length;
                };

                var createBucketAggregator = function (bucketFuncName) {
                    return function () {
                        var aggregated = [], i = buckets.length;
                        while (i--) {
                            buckets[i][bucketFuncName](aggregated);
                        }
                        return aggregated;
                    };
                };

                this.keys = createBucketAggregator("keys");
                this.values = createBucketAggregator("values");
                this.entries = createBucketAggregator("getEntries");

                this.remove = function (key) {
                    checkKey(key);

                    var hash = hashingFunction(key), bucketIndex, oldValue = null;

                    var bucket = getBucketForHash(bucketsByHash, hash);

                    if (bucket) {
                        oldValue = bucket.removeEntryForKey(key);
                        if (oldValue !== null) {
                            if (!bucket.entries.length) {
                                bucketIndex = searchBuckets(buckets, hash);
                                arrayRemoveAt(buckets, bucketIndex);
                                delete bucketsByHash[hash];
                            }
                        }
                    }
                    return oldValue;
                };

                this.size = function () {
                    var total = 0, i = buckets.length;
                    while (i--) {
                        total += buckets[i].entries.length;
                    }
                    return total;
                };

                this.each = function (callback) {
                    var entries = that.entries(), i = entries.length, entry;
                    while (i--) {
                        entry = entries[i];
                        callback(entry[0], entry[1]);
                    }
                };

                this.putAll = function (hashtable, conflictCallback) {
                    var entries = hashtable.entries();
                    var entry, key, value, thisValue, i = entries.length;
                    var hasConflictCallback = (typeof conflictCallback == FUNCTION);
                    while (i--) {
                        entry = entries[i];
                        key = entry[0];
                        value = entry[1];

                        if (hasConflictCallback && (thisValue = that.get(key))) {
                            value = conflictCallback(key, thisValue, value);
                        }
                        that.put(key, value);
                    }
                };

                this.clone = function () {
                    var clone = new Hashtable(hashingFunctionParam, equalityFunctionParam);
                    clone.putAll(that);
                    return clone;
                };
            }

            return Hashtable;
        })(),
        md5: function (str) {
            function toHexString(charCode) {
                return ('0' + charCode.toString(16)).slice(-2);
            }
            var converter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            converter.charset = 'UTF-8';
            var result = {};
            var data = converter.convertToByteArray(str, result);
            var ch = Components.classes['@mozilla.org/security/hash;1']
            .createInstance(Components.interfaces.nsICryptoHash);
            ch.init(ch.MD5);
            ch.update(data, data.length);
            var hash = ch.finish(false);
            var md5string = '';
            for (var i in hash) {
                md5string += toHexString(hash.charCodeAt(i));
            }
            return md5string.substr(0, 32);
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

                for (var f in _fields) {
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

        /**
        * main code start
        */
        addonName: 'AntiPorn',
        addonVersion: '0.19.6.10',
        blockUrlBase: null,
        cloudUrlBase: null,
        cloudIPBase: null,
        initialized: null,
        prefs: Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.cloudaclantiporn.'),
        /**
        * false for kids mode, cannot change security profile 
        * true  for parental mode, can change any security profile
        */
        urlPolicyInit: function () {
            this.urlPolicy = new this.Hashtable();
            this.alertPolicy = new this.Hashtable();
            this.urlCache = new this.Hashtable();
            this.urlDB = new this.Hashtable();
            this.topDN = new this.Hashtable(); // the code has been deleted
            this.initCloudUrl();
            this.blockPolicyInit();
            this.alertPolicyInit();
            this.updateUrlCacheFromStorage();
        },
        contentListener: function (aEvent) {
            var doc = aEvent.target;
            var aURI = doc.baseURIObject;
            cloudaclAntiPorn.processNewURL(aURI);
        },
        WebBlockListener: {
            STATE_START: Components.interfaces.nsIWebProgressListener.STATE_START,
            STATE_STOP: Components.interfaces.nsIWebProgressListener.STATE_STOP,
            STATE_IS_DOCUMENT: Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT,

            QueryInterface: function (aIID) {
                if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
                aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                aIID.equals(Components.interfaces.nsISupports)) {
                    return this;
                }
                throw Components.results.NS_NOINTERFACE;
            },

            onLocationChange: function (aProgress, aRequest, aURI) {
                cloudaclAntiPorn.processNewURL(aURI);
            },
            onStatusChange: function (a, b, c, d) { },
            onProgressChange: function (a, b, c, d, e, f) { },
            onSecurityChange: function (a, b, c, d) { },
            onLinkIconAvailable: function (a, b, c) { }
        },
        init: function () {
            this.initialized = true;
            this.readUrlDB();
            this.readTopDomain();
            this.strings = document.getElementById("cloudaclAntiPorn-strings");
            this.checkVersionChanged();
            cloudaclAntiPorn.WebBlockPrefObserver.register();
            document.addEventListener("DOMContentLoaded", cloudaclAntiPorn.contentListener, false);
            gBrowser.addProgressListener(cloudaclAntiPorn.WebBlockListener);
        },
        uninit: function () {
            if (this.getBoolPref("bg_verified")) {
                this.setBoolPref("bg_verified", false);
            }
            gBrowser.removeProgressListener(cloudaclAntiPorn.WebBlockListener);
        },
        log: function (s) {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage('DEBUG --- ' + s);
        },
        processNewURL: function (aURI) {
            if (this.prefs.getBoolPref("parent_mode")) {
                return; 
            }
            if (aURI === null) { return; }
            var url = aURI.spec;
            var p = new cloudaclAntiPorn.URLParser(url);
            var proto = p.getProtocol();
            if (proto != "http" && proto != "https" && proto != "ftp") { return; }
            var host = cloudaclAntiPorn.urlNormorlize(p.getHost());
            if (/google\./.test(host)) {
                if (/\/url\?/.test(url)) {
                    return;
                }
                else if ((/www\.google\./.test(url)) && (/[?&]q=/.test(url)) && (!(/safe=high/.test(url)))) {
                    var newUrl = url + "&safe=high";
                    openUILinkIn(newUrl, "current");
                    return;
                }
            }
            if (/cloudacl\.com/.test(host)) { return; }
            var isIP = false;
            if (/^[0-9]{1,3}\.[0-9]{1,3}/.test(host)) {
                if (/^(192\.168\.|10\.1\.|127\.16\.)/.test(host)) {
                    return;
                }
                isIP = true;
            }
            var cid = this.queryLocalCache(host, isIP);


            if (cid !== -1) {
                this.sendAlert(host, cid, url);
            }

            if (cid === 100 || this.isCategoryBlocked(cid)) {
                this.blockBadHost(host, cid);
            } else if (cid === -1) { /* not in local, query cloud */
                var url2 = url.indexOf("?") == -1 ? url : url.substring(0, url.indexOf("?"));
                cloudaclAntiPorn.queryCloud(url2, isIP, url);
            }
        },
        queryLocalCache: function (url, isIP) {
            var cid;
            if (url === null) { return; }
            var urlHash = this.md5(url);
            if (this.urlCache.containsKey(urlHash)) {
                cid = this.urlCache.get(urlHash) + '';
                return cid;
            }
            if (!isIP && this.urlDB.containsKey(urlHash)) {
                cid = this.urlDB.get(urlHash) + '';
                return cid;
            }
            return -1;
        },
        queryCloud: function (host, isIP, rawUrl) {
            var _this = this;
            var cloudUrl = isIP ? this.cloudIPBase : this.cloudUrlBase;
            var urlHash = this.md5(host);
            cloudUrl = cloudUrl + "&url=" + encodeURIComponent(host);
            var req = new XMLHttpRequest();
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    var s = req.responseXML.getElementsByTagName('ns:return')[0];
                    if (s === null) { return 0; }
                    var cid = s.firstChild.nodeValue;
                    if (cid === null || cid < 0) { cid = 0; }

                    _this.sendAlert(host, cid, rawUrl);

                    cloudaclAntiPorn.urlCache.put(urlHash, cid);
                    if (cloudaclAntiPorn.isCategoryBlocked(cid)) {
                        cloudaclAntiPorn.blockBadHost(host, cid);
                    }
                }
            };
            req.open('GET', cloudUrl, true);
            req.send(null);
        },
        isCategoryBlocked: function (cid) {
            if (cid === 0) { return false; }
            if (cloudaclAntiPorn.urlPolicy.containsKey(cid)) {
                var isBlocked = cloudaclAntiPorn.urlPolicy.get(cid);
                if (isBlocked === true) { return true; }
            }
            return false;
        },
        blockBadHost: function (host, cid) {
            var blockUrl = this.blockUrlBase + "&url=" + encodeURIComponent(host) + "&cid=" + encodeURIComponent(cid) + "&nv=false";
            openUILinkIn(blockUrl, "current");
        },
        isCategoryToAlert: function (cid) {
            return this.alertPolicy.get(cid.toString());
        },
        isEmailAlertEnabled: function () {
            return this.prefs.getBoolPref('alert_email');
        },
        sendAlert: function (host, cid, rawUrl) {
            if (this.isEmailAlertEnabled()) {
                if (cid === 100 || this.isCategoryToAlert(cid)) {
                    cloudacl.alertHelper.send_alert(host, cid, rawUrl, this.addonName);
                }
            }
        },
        urlNormorlize: function (url) {
            var site = url.toLowerCase();
            return site.toLowerCase().replace(/^www\./gi, "");
        },

        WebBlockPrefObserver: {
            register: function () {
                var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                    .getService(Components.interfaces.nsIPrefService);
                this._branch = prefService.getBranch("extensions.cloudaclantiporn.");
                this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
                this._branch.addObserver("", this, false);
            },
            log: function (s) {
                var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
            .getService(Components.interfaces.nsIConsoleService);
                consoleService.logStringMessage('DEBUG --- ' + s);
            },
            unregister: function () {
                if (!this._branch) { return; }
                this._branch.removeObserver("", this);
            },
            observe: function (aSubject, aTopic, aData) {
                if (aTopic != "nsPref:changed") { return; }

                if (/cid.+/i.test(aData)) {
                    cloudaclAntiPorn.urlCache.clear();

                    switch (aData) {
                        case "cid1pref":
                            cloudaclAntiPorn.urlPolicy.put("1", cloudaclAntiPorn.urlPolicy.get("1") ? false : true);
                            break;
                        case "cid2pref":
                            cloudaclAntiPorn.urlPolicy.put("2", cloudaclAntiPorn.urlPolicy.get("2") ? false : true);
                            break;
                        case "cid3pref":
                            cloudaclAntiPorn.urlPolicy.put("3", cloudaclAntiPorn.urlPolicy.get("3") ? false : true);
                            break;
                        case "cid4pref":
                            cloudaclAntiPorn.urlPolicy.put("4", cloudaclAntiPorn.urlPolicy.get("4") ? false : true);
                            break;
                        case "cid5pref":
                            cloudaclAntiPorn.urlPolicy.put("5", cloudaclAntiPorn.urlPolicy.get("5") ? false : true);
                            break;
                        case "cid6pref":
                            cloudaclAntiPorn.urlPolicy.put("6", cloudaclAntiPorn.urlPolicy.get("6") ? false : true);
                            break;
                        case "cid7pref":
                            cloudaclAntiPorn.urlPolicy.put("7", cloudaclAntiPorn.urlPolicy.get("7") ? false : true);
                            break;
                        case "cid8pref":
                            cloudaclAntiPorn.urlPolicy.put("8", cloudaclAntiPorn.urlPolicy.get("8") ? false : true);
                            break;
                        case "cid9pref":
                            cloudaclAntiPorn.urlPolicy.put("9", cloudaclAntiPorn.urlPolicy.get("9") ? false : true);
                            break;
                    }

                    cloudaclAntiPorn.updateUrlCacheFromStorage();
                }
                if (aData == "cloudaclBlackWhiteList") {
                    cloudaclAntiPorn.urlCache.clear();
                    cloudaclAntiPorn.updateUrlCacheFromStorage();
                }
            }
        },
        blockPolicyInit: function () {
            this.urlPolicy.put("0", false);
            this.urlPolicy.put("100", true);
            this.urlPolicy.put("101", false);
            for (var i = 1; i <= 9; i++) {
                var cname = "cid" + i + "pref";
                this.urlPolicy.put(i.toString(), this.prefs.getBoolPref(cname));
            }
        },
        alertPolicyInit: function () {
            this.alertPolicy.put("0", false);
            this.alertPolicy.put("100", true);
            this.alertPolicy.put("101", false);
            for (var i = 1; i <= 9; i++) {
                var cname = "cid" + i + "alert";
                this.alertPolicy.put(i.toString(), this.prefs.getBoolPref(cname));
            }
        },
        /* Preference setup API */
        getBoolPref: function (name) {
            return this.prefs.getBoolPref(name);
        },
        setBoolPref: function (name, val) {
            this.prefs.setBoolPref(name, val);
        },
        onInstall: function () {
            this.setBoolPref("cid1pref", true);
            this.setBoolPref("cid2pref", true);
            this.setBoolPref("cid3pref", true);
            this.setBoolPref("cid4pref", false);
            this.setBoolPref("cid5pref", true);
            this.setBoolPref("cid6pref", false);
            this.setBoolPref("cid7pref", false);
            this.setBoolPref("cid8pref", false);
            this.setBoolPref("cid9pref", false);

            this.setBoolPref("cid1alert", false);
            this.setBoolPref("cid2alert", false);
            this.setBoolPref("cid3alert", false);
            this.setBoolPref("cid4alert", false);
            this.setBoolPref("cid5alert", false);
            this.setBoolPref("cid6alert", false);
            this.setBoolPref("cid7alert", false);
            this.setBoolPref("cid8alert", false);
            this.setBoolPref("cid9alert", false);
        },
        onUpdate: function () {
        },
        initCloudUrl: function () {
            var param = "app=firefox_" + encodeURIComponent(this.addonName) + "&ver=" + encodeURIComponent(this.addonVersion);
            this.blockUrlBase = "http://www.cloudacl.com/blockpage/?" + param;
            this.cloudUrlBase = "http://api.cloudacl.com/axis2/services/WebFilteringService/getCategoryByUrl?" + param;
            this.cloudIPBase = "http://api.cloudacl.com/axis2/services/WebFilteringService/getCategoryByIP?" + param;
        },
        setVersion: function (ver) {
            this.addonVersion = ver;
        },
        readfile: function (file) {
            var ioService = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
            var scriptableStream = Components
            .classes["@mozilla.org/scriptableinputstream;1"]
            .getService(Components.interfaces.nsIScriptableInputStream);
            var channel = ioService.newChannel(file, null, null);
            var input = channel.open();
            scriptableStream.init(input);
            var str = scriptableStream.read(input.available());
            scriptableStream.close();
            input.close();
            return str;
        },
        readUrlDB: function () {
            var s = this.readfile("chrome://cloudaclAntiPorn/content/category.json");
            if (s) {
                var d = JSON.parse(s);
                for (var n in d) {
                    this.urlDB.put(n, d[n]);
                }
            }
        },
        readTopDomain: function () {
            var s = this.readfile("chrome://cloudaclAntiPorn/content/top_domain.json");
            if (s) {
                var d = JSON.parse(s);
                for (var n in d) {
                    this.topDN.put(n, d[n]);
                }
            }
        },
        checkVersionChanged: function () {
            var currVersion = this.addonVersion;
            var prevVersion = '';
            try {
                prevVersion = this.prefs.getCharPref('version');
            } catch (e) {
            }
            this.show_toolbar_button("cloudaclAntiPorn-toolbar-button", "urlbar-container");
            if (currVersion != prevVersion) {
                if (typeof prevVersion === '') {
                    this.onInstall();
                } else {
                    this.onUpdate();
                }
                this.addonVersion = currVersion;
                this.prefs.setCharPref("version", currVersion);
            }
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
        clearUrlCache: function () {
            /* bug with hashtable remove method */
            this.urlCache.clear();
            this.updateUrlCacheFromStorage();

        },
        updateUrlCacheFromStorage: function () {
            var bwList = this.getBlackWhiteList();
            for (var n in bwList) {
                var site2 = this.urlNormorlize(n);
                var urlHash = this.md5(site2);
                this.urlCache.put(urlHash, bwList[n]);
            }
        },
        getUrlProtocol: function (url) {
            var p = new this.URLParser(url);
            return p.getProtocol();
        },
        getUrlHost: function (url) {
            var p = new this.URLParser(url);
            return p.getHost();
        },
        removeSiteFromBWList: function (site) {
            var site2 = this.urlNormorlize(site);
            this.delEntryFromBlackWhiteList(site2);
            this.removeFromUrlCache(site2);
        },
        delEntryFromBlackWhiteList: function (site) {
            var bwList = this.getBlackWhiteList();
            if (bwList) {
                delete bwList[site];
                this.setBlackWhiteList(bwList);
            }
        },
        removeFromUrlCache: function (site) {
            var site2 = this.urlNormorlize(site);
            var urlHash = this.md5(site2);
            if (this.urlCache.containsKey(urlHash)) {
                this.urlCache.remove(urlHash);
            }
        },
        addEntry2BlackWhiteList: function (site, cid) {
            var bwList = this.getBlackWhiteList();
            bwList[site] = cid;
            this.setBlackWhiteList(bwList);
        },
        addSite2BWList: function (site, cid) {
            var site2 = this.urlNormorlize(site);
            var urlHash = this.md5(site2);
            this.addEntry2BlackWhiteList(site2, cid);
            this.urlCache.put(urlHash, cid);
        },
        addSite2BlackList: function (site) {
            this.addSite2BWList(site, 100);
        },
        addSite2WhiteList: function (site) {
            this.addSite2BWList(site, 101);
        },
        getHostFromBlockPage: function (url) {
            var p = new this.URLParser(url);
            var regexRes = /url=(.*?)&cid=/i.exec(p.getQuerystring());
            if (regexRes) {
                var host = regexRes[1];
                host = decodeURIComponent(host);
                p = new this.URLParser(host);
                return p.getHost();
            }
            else {
                return null;
            }
        },

        showAlert: function (title, message) {
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
            promptService.alert(window, title, message);
        },
        reloadCurrentTab: function () {
            var url = window.content.location.href;
            var p = new this.URLParser(url);
            var host = p.getHost();
            if (host === "www.cloudacl.com") {
                var curTab = getBrowser().selectedTab;
                var curbrowser = getBrowser().getBrowserForTab(curTab);
                curbrowser.goBack();
            }
            else {
                BrowserReload();
            }
        },
        getHostfromTab: function () {
            var url = window.content.location.href;
            var proto = this.getUrlProtocol(url);
            if (proto != "http" && proto != "ftp" && proto != "https") {
                return;
            }
            var p = new this.URLParser(url);
            proto = p.getProtocol();
            var host = p.getHost();
            if (host === "www.cloudacl.com") {
                host = this.getHostFromBlockPage(url);
            }
            return this.urlNormorlize(host);
        },
        onMenuItemCommand_addBlock: function (e) {
            var host = this.getHostfromTab();
            if (host) {
                this.addSite2BlackList(host);
                BrowserReload();
            }
        },
        onMenuItemCommand_addTrust: function (e) {
            var host = this.getHostfromTab();
            this.addSite2WhiteList(host);
            this.reloadCurrentTab();
        },
        onMenuItemCommand_clearSite: function (e) {
            var host = this.getHostfromTab();
            if (host) {
                this.removeSiteFromBWList(host);
            }
            this.reloadCurrentTab();
        },
        onMenuItemCommand_tooloption: function (e) {
            var tab = getBrowser().addTab("chrome://cloudaclAntiPorn/content/options.html");
            getBrowser().selectedTab = tab;
        },
        onMenuItemCommand_feedback: function (e) {
            var host = this.getHostfromTab();
            var feedbackUrl = "http://www.cloudacl.com/blockpage/feedback/";
            if (host) {
                feedbackUrl += "?url=" + host;
            }
            var tab = getBrowser().addTab(feedbackUrl);
            getBrowser().selectedTab = tab;
        },
        show_toolbar_button: function (id, before) {
            try {
                var nbr = document.getElementById("nav-bar");

                if (!this.getBoolPref("enable_toolbar")) {
                    var elem = nbr.firstChild;
                    while (elem) {
                        if (elem.id === id) {
                            nbr.removeChild(elem);
                        }
                        elem = elem.nextSibling;
                    }
                    return;
                }

                var currentSet = nbr.currentSet;

                var curSet = currentSet.split(",");
                if (curSet.indexOf(id) == -1) {
                    nbr.insertItem(id, null, null, false);
                    nbr.setAttribute("currentset", nbr.currentSet);
                }

                nbr.removeAttribute("collapsed");
                document.persist("nav-bar", "collapsed");

            } catch (e) {
            }
        },
        updateToolbarMenuLabel: function (event) {
            var mb = document.getElementById("context-cloudaclAntiPorn-addBlock");
            var mt = document.getElementById("context-cloudaclAntiPorn-addTrust");
            var mc = document.getElementById("context-cloudaclAntiPorn-clearSite");
            mb.label = "Add Block Site";
            mt.label = "Add Trust Site";
            mc.label = "Remove from Block/Trust";
            var host = this.getHostfromTab();
            if (host && this.getBoolPref("parent_mode")) {
                mb.hidden = false;
                mt.hidden = false;
                mc.hidden = false;
                mb.label += ":  " + host;
                mt.label += ":  " + host;
            } else {
                mb.hidden = true;
                mt.hidden = true;
                mc.hidden = true;
            }
        },
        onToolbarButtonCommand: function (e) {
            this.onMenuItemCommand_tooloption(e);
        }

    };             /* cloudaclAntiPorn */
})();



