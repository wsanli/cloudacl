var cloudaclWebFilter = {
    /**
    * jshashtable
    *
    * jshashtable is a JavaScript implementation of a hash table. It creates a single constructor function called Hashtable
    * in the global scope.
    *
    * Author: Tim Down <tim@timdown.co.uk>
    * Version: 2.1
    * Build date: 21 March 2010
    * Website: http://www.timdown.co.uk/jshashtable
    */
    Hashtable: (function () {
        var FUNCTION = "function";
        var arrayRemoveAt = (typeof Array.prototype.splice == FUNCTION) ?
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
                    for (i = 0, len = itemsAfterDeleted.length; i < len; ++i) {
                        arr[idx + i] = itemsAfterDeleted[i];
                    }
                }
            };

        function hashObject(obj) {
            var hashCode;
            if (typeof obj == "string") {
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
                for (var i = 0, len = this.entries.length; i < len; ++i) {
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
    /**
    *
    *  MD5 (Message-Digest Algorithm)
    *  http://www.webtoolkit.info/
    *
    **/
    md5: function (string) {
        function RotateLeft(lValue, iShiftBits) {
            return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        }
        function AddUnsigned(lX, lY) {
            var lX4, lY4, lX8, lY8, lResult;
            lX8 = (lX & 0x80000000);
            lY8 = (lY & 0x80000000);
            lX4 = (lX & 0x40000000);
            lY4 = (lY & 0x40000000);
            lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        }

        function F(x, y, z) { return (x & y) | ((~x) & z); }
        function G(x, y, z) { return (x & z) | (y & (~z)); }
        function H(x, y, z) { return (x ^ y ^ z); }
        function I(x, y, z) { return (y ^ (x | (~z))); }

        function FF(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function GG(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function HH(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function II(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

        function ConvertToWordArray(string) {
            var lWordCount;
            var lMessageLength = string.length;
            var lNumberOfWords_temp1 = lMessageLength + 8;
            var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
            var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
            var lWordArray = Array(lNumberOfWords - 1);
            var lBytePosition = 0;
            var lByteCount = 0;
            while (lByteCount < lMessageLength) {
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
            lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
            lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
            return lWordArray;
        };

        function WordToHex(lValue) {
            var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
            for (lCount = 0; lCount <= 3; lCount++) {
                lByte = (lValue >>> (lCount * 8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
            }
            return WordToHexValue;
        };

        function Utf8Encode(string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        };

        var x = Array();
        var k, AA, BB, CC, DD, a, b, c, d;
        var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
        var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
        var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
        var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

        string = Utf8Encode(string);

        x = ConvertToWordArray(string);

        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

        for (k = 0; k < x.length; k += 16) {
            AA = a; BB = b; CC = c; DD = d;
            a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
            d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
            c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
            b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
            a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
            d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
            c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
            b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
            a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
            d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
            c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
            b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
            a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
            d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
            c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
            b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
            a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
            d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
            c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
            b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
            a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
            d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
            c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
            b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
            a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
            d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
            c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
            b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
            a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
            d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
            c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
            b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
            a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
            d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
            c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
            b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
            a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
            d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
            c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
            b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
            a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
            d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
            c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
            b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
            a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
            d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
            c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
            b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
            a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
            d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
            c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
            b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
            a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
            d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
            c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
            b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
            a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
            d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
            c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
            b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
            a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
            d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
            c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
            b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
            a = AddUnsigned(a, AA);
            b = AddUnsigned(b, BB);
            c = AddUnsigned(c, CC);
            d = AddUnsigned(d, DD);
        }

        var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

        return temp.toLowerCase();
    },

    URLParser: function (url) {
        cloudaclWebFilter.URLParser.prototype.setURL = function (url) {
            this._parse(url);
        }

        cloudaclWebFilter.URLParser.prototype._initValues = function () {
            for (var f in this._fields) {
                this._values[f] = '';
            }
        }
        cloudaclWebFilter.URLParser.prototype._parse = function (url) {
            this._initValues();
            var r = this._regex.exec(url);
            if (!r) throw "DPURLParser::_parse -> Invalid URL";

            for (var f in this._fields) if (typeof r[this._fields[f]] != 'undefined') {
                this._values[f] = r[this._fields[f]];
            }
        }
        cloudaclWebFilter.URLParser.prototype._makeGetter = function (field) {
            return function () {
                return this._values[field];
            }
        }
        this._fields = {
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
        this._values = {};
        this._regex = null;
        this.version = 0.1;
        this._regex = /^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/;

        for (var f in this._fields) {
            this['get' + f] = this._makeGetter(f);
        }

        if (typeof url != 'undefined') {
            this._parse(url);
        }
    },
    addonName: null,
    versoin: null,
    blockUrlBase: null,
    cloudUrlBase: null,
    cloudIPBase: null,
    /**
    * false for kids mode, cannot change security profile 
    * true  for parental mode, can change any security profile
    */
    parentMode: false,
    parentPasswd: "",
    isParentMode: function () {
        return this.parentMode;
    },
    setParentMode: function () {
        this.parentMode = true;
    },
    hasParentPasswd: function () {
        return true;
    },
    getParentPasswd: function () {
        return this.getPref("parentPassword");
    },
    setParentPasswd: function (mypass) {
        this.setPref("parentPassword", mypass);
    },
    setKidMode: function () {
        this.parentMode = false;
    },
    BlockPolicyInit: function () {
        this.urlPolicy.put("0", false);
        for (var i = 1; i <= 9; i++) {
            var cname = "cid" + i + "pref";
            this.urlPolicy.put(i.toString(), this.getPref(cname) == "true" ? true : false);
        }
    },
    AlertPolicyInit: function () {
        this.alertPolicy.put("0", false);
        for (var i = 1; i <= 9; i++) {
            var cname = "cid" + i + "alert";
            this.alertPolicy.put(i.toString(), this.getPref(cname) == "true" ? true : false);
        }
    },
    /* Preference setup API */
    getPref: function (name) {
        return localStorage[name];
    },
    setPref: function (name, val) {
        localStorage[name] = val;
    },
    getPrefItem: function (name) {
        return localStorage.getItem(name);
    },
    setPrefItem: function (name, val) {
        localStorage.setItem(name, val);
    },
    urlPolicyInit: function () {
        this.addonName = this.getAddonName();
        this.checkVersionchanged();
        this.initCloudUrl();
        this.urlPolicy = new this.Hashtable();
        this.alertPolicy = new this.Hashtable();
        this.urlCache = new this.Hashtable();
        this.urlDB = new this.Hashtable();
        this.topDN = new this.Hashtable();
        this.BlockPolicyInit();
        this.AlertPolicyInit();
        this.updateUrlCacheFromStorage();
    },
    onInstall: function () {
        this.setPref("cid1pref", true);
        this.setPref("cid2pref", true);
        this.setPref("cid3pref", true);
        this.setPref("cid4pref", false);
        this.setPref("cid5pref", false);
        this.setPref("cid6pref", false);
        this.setPref("cid7pref", false);
        this.setPref("cid8pref", false);
        this.setPref("cid9pref", false);
    },
    onUpdate: function () {
    },
    initCloudUrl: function () {
        var param = "app=chrome_" + this.addonName + "&ver=" + this.getVersion();
        this.blockUrlBase = "http://www.cloudacl.com/blockpage/?" + param;
        this.cloudUrlBase = "http://api.cloudacl.com/axis2/services/WebFilteringService/getCategoryByUrl?" + param;
        this.cloudIPBase = "http://api.cloudacl.com/axis2/services/WebFilteringService/getCategoryByIP?" + param;
    },
    getVersion: function () {
        var version = 'NaN';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', chrome.extension.getURL('manifest.json'), false);
        xhr.send(null);
        var manifest = JSON.parse(xhr.responseText);
        return manifest.version;
    },
    getAddonName: function() {
        return "antiporn";
        /*
        var version = 'NaN';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', chrome.extension.getURL('manifest.json'), false);
        xhr.send(null);
        var manifest = JSON.parse(xhr.responseText);
        return manifest.name.toLowerCase();
        */
    },
    checkVersionchanged: function () {
        var currVersion = this.getVersion();
        var prevVersion = this.getPref('version');
        if (currVersion != prevVersion) {
            if (typeof prevVersion == 'undefined') {
                this.onInstall();
            } else {
                this.onUpdate();
            }
            this.version = currVersion;
            this.setPref("version", currVersion);
        }
    },
    getBlackWhiteList: function () {
        return this.getPrefItem("cloudaclBlackWhiteList") ? JSON.parse(this.getPrefItem("cloudaclBlackWhiteList")) : {};
    },
    setBlackWhiteList: function (bwList) {
        this.setPrefItem("cloudaclBlackWhiteList", JSON.stringify(bwList));
    },
    clearUrlCache: function () {
        /* bug with hashtable remove method */
        this.urlCache.clear();
        this.updateUrlCacheFromStorage();

    },
    updateUrlCacheFromStorage: function () {
        var bwList = this.getBlackWhiteList();
        for (n in bwList) {
            var site2 = this.urlNormorlize(n);
            var urlHash = this.md5(site2);
            this.urlCache.put(urlHash, bwList[n]);
        }
    },
    getUrlProtocol: function (url) {
        var p = new this.URLParser(url);
        return p.getProtocol();
    },
    processNewURL: function (url, tabid) {
        var p = new this.URLParser(url);
        var proto = p.getProtocol();
        if (proto != "http" && proto != "ftp" && proto != "https") return;
        var host = this.urlNormorlize(p.getHost());

        if (/api\.cloudacl\.com/.test(host)) return;
        var isBlock = false;
        if (/api\.cloudacl\.com/.test(host)) { return; }
        if (/^[0-9]{1,3}\.[0-9]{1,3}/.test(host)) {
            if (/^(192\.168\.|10\.1\.)/.test(host)) {
                return;
            }
            isBlock = this.ApplyUrlPolicy(host, true, tabid, url);
        } else {
            isBlock = this.ApplyUrlPolicy(host, false, tabid, url);
        }
        return { "action": isBlock, "url": host }
    },
    ApplyUrlPolicy: function (url, isIP, tabid, rawUrl) {
        if (url == null) return;
        var urlHash = this.md5(url);
        var found = false;
        var isBlock = false;

        var doPatch = false;
        if (Math.random() > 0.5) {
            doPatch = true;
        }

        if (this.urlCache.containsKey(urlHash)) {
            found = true;
            var cid = this.urlCache.get(urlHash);

            this.sendAlert(url, cid, rawUrl);

            if (doPatch) {
                this.queryCloud(rawUrl, isIP, urlHash, tabid, rawUrl, true);
            }

            if (cid == 101) return false; // white list(101), black list 100 
            if (cid == 100 || this.isCategoryBlocked(cid)) {
                this.blockBadHost(url, cid, tabid, rawUrl);
                isBlock = true;
            }
            return isBlock;
        }
        if (!isIP && !found && this.urlDB.containsKey(urlHash)) {
            found = true;
            var cid = this.urlDB.get(urlHash) + '';

            this.sendAlert(url, cid, rawUrl);

            if (this.isCategoryBlocked(cid)) {
                this.blockBadHost(url, cid, tabid, rawUrl);
                isBlock = true;
            }

            if (doPatch) {
                this.queryCloud(rawUrl, isIP, urlHash, tabid, rawUrl, true);
            }

            return isBlock;
        }
        if (!found) {
            this.queryCloud(rawUrl, isIP, urlHash, tabid, rawUrl, false);
        }
        return isBlock;
    },
    queryCloud: function (host, isIP, urlHash, tabid, rawUrl, patch) {
        var _this = this;
        var cloudUrl = isIP ? this.cloudIPBase : this.cloudUrlBase;
        cloudUrl = cloudUrl + "&url=" + escape(host);
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                var s = req.responseXML.getElementsByTagName('return')[0];
                if (s == null) return 0;
                var cid = parseInt(s.firstChild.nodeValue);
                if (cid == null || cid < 0) cid = 0;

                _this.sendAlert(host, cid, rawUrl);

                if (!patch) {
                    if (cloudaclWebFilter.urlCache.containsKey(urlHash)) {
                        var tmpcid = cloudaclWebFilter.urlCache.get(urlHash);
                        if (tmpcid != 101 && tmpcid != 100) {
                            cloudaclWebFilter.urlCache.put(urlHash, cid);
                        }
                    }
                    else {
                        cloudaclWebFilter.urlCache.put(urlHash, cid);
                    }
                }
                if (cloudaclWebFilter.isCategoryBlocked(cid)) {
                    if (!patch) {
                        cloudaclWebFilter.blockBadHost(host, cid, tabid, rawUrl);
                    }
                }
            }
        }
        req.open('GET', cloudUrl, true);
        req.send(null);
        return 0;
    },
    /*
    getSubDomains: function (host) {
    var doms = [];
    var a = host.split(".");
    var size = a.length;
    var tmp = a[size -1];
    for (var i = size - 2; i >= size - 4 && i >= 0   ; i--) {
    tmp = a[i] + "." + tmp;
    if (!this.topDN.containsKey(a[i].toUpperCase())) {
    doms.push(tmp);
    }
    }
    return doms;
    },
    */
    isCategoryBlocked: function (cid) {
        return this.urlPolicy.get(cid.toString());
    },
    blockBadHost: function (host, cid, tabid, rawUrl) {
        if (tabid != null || tabid != undefined) {
            var language = window.navigator.userLanguage || window.navigator.language;
            var blockUrl = this.blockUrlBase + "&url=" + host + "&cid=" + cid + "&nv=" + isNewVersion.toString() + "&lang=" + language + "&raw=" + encodeURIComponent(rawUrl);
            chrome.tabs.update(tabid, { url: blockUrl });
        }
    },
    isCategoryToAlert: function (cid) {
        return this.alertPolicy.get(cid.toString());
    },
    isEmailAlertEnabled: function () {
        return (localStorage['alert_email'] === 'true') ? true : false;
    },
    sendAlert: function (host, cid, rawUrl) {
        if (this.isEmailAlertEnabled()) {
            if (cid == 100 || this.isCategoryToAlert(cid)) {
                send_alert(host, cid, rawUrl);
            }
        }
    },
    urlNormorlize: function (url) {
        if (url == null) return;
        return url.toLowerCase().replace(/^www\./gi, "");
    },
    clearBWList: function () {
        var bwList = this.getBlackWhiteList();
        for (var site in bwList) {
            this.removeSiteFromBWList(site);
            delete bwList[site];
        }
        this.setBlackWhiteList(bwList);
    },
    clearBlackList: function () {
        var bwList = this.getBlackWhiteList();
        for (var site in bwList) {
            if (bwList[site] == 100) {
                this.removeSiteFromBWList(site);
                delete bwList[site];
            }
        }
        this.setBlackWhiteList(bwList);
    },
    clearWhiteList: function () {
        var bwList = this.getBlackWhiteList();
        for (var site in bwList) {
            if (bwList[site] == 101) {
                this.removeSiteFromBWList(site);
                delete bwList[site];
            }
        }
        this.setBlackWhiteList(bwList);
    },
    removeSiteFromBWList: function (site) {
        var site2 = this.urlNormorlize(site);
        this.delEntryFromBlackWhiteList(site2);
        this.removeFromUrlCache(site2);
    },
    delEntryFromBlackWhiteList: function (site) {
        var bwList = this.getBlackWhiteList();
        delete bwList[site];
        this.setBlackWhiteList(bwList);
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
        var proto = p.getProtocol();
        var regex = /url=(\w+:\/\/)?((\w+):?(\w+)?@)?([^\/\?:\&\#]+)(:\d+)?(\/?[^\?#]+)?((\&\w+=)?|$)/i;
        var regexRes = regex.exec(p.getQuerystring());
        if (regexRes) {
            return regexRes[5];
        }
        else {
            return null;
        }
    },
    getRawFromBlockPage: function (url) {
        var p = new this.URLParser(url);
        var proto = p.getProtocol();
        var regexRes = /\&raw=([^\&]+)/i.exec(p.getQuerystring())
        if (regexRes) {
            return regexRes[1];
        }
        else {
            return null;
        }
    },
    getHostFromTab: function (url) {
        var p = new this.URLParser(url);
        var proto = p.getProtocol();
        var host = p.getHost();
        if (this.isBlockpage(host)) {
            host = this.getHostFromBlockPage(url);
        }
        host = this.urlNormorlize(host);
        return host;
    },
    isBlockpage: function (host) {
        if (host == "api.cloudacl.com" || host == "www.cloudacl.com") {
            return true;
        }
        else {
            return false;
        }
    },
    getRequestUrl: function (taburl) {
        var p = new this.URLParser(taburl);
        var host = p.getHost();
        if (this.isBlockpage(host)) {
            raw = this.getRawFromBlockPage(taburl);
            if (raw) {
                return decodeURIComponent(raw);
            }
            else {
                return this.getHostFromBlockPage(taburl);
            }
        }
        else {
            return taburl;
        }
    }
}
cloudaclWebFilter.urlPolicyInit();
