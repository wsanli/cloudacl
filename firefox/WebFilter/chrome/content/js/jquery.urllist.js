; jQuery.noConflict();
(function ($) {
    "use strict";
    $.strFormat = function (s) {
        var args = Array.prototype.slice.call(arguments, 1);
        return s.replace(/\{\{|\}\}|\{(\d+)\}/g, function (curlyBrack, index) {
            return ((curlyBrack === "{{") ? "{" : ((curlyBrack === "}}") ? "}" : args[index]));
        });
    };
    $.urllist = $.urllist || {
        name: "UrlList",
        version: "v1.0.0",
        author: "swang@cloudacl.com",
        license: "GPL"
    };
    $.fn.urllist = function (sel, options) {
        var opts = $.extend({}, $.fn.urllist.defaults, options || {});

        //some shared varibles
        var strLI = '<li><input style="width:{0}px" type="text" value="{1}" /><span>[x]</span></li>';
        var inputWidth = (opts.width - opts.delWidth).toString();
        var $dstObj = jQuery(sel);

        $dstObj.addClass(opts.className);
        $dstObj.css("width", opts.width);
        $dstObj.empty();

        var pubFunctions = {
            getlist: function () {
                return opts.list;
            },
            loadlist: function (urls) {
                var _this = this;
                opts.list = [];
                $dstObj.empty();
                for (var i in urls) {
                    var obj = urls[i];
                    if (obj && obj.length > 0) {
                        var li = $.strFormat(strLI, inputWidth, obj.toString());
                        $(li).appendTo($dstObj);

                        opts.list.push(obj.toString());
                    }
                }
                var newline = $.strFormat(strLI, inputWidth, "");
                $(newline).appendTo($dstObj);

                _this.addListEvent();
            },
            addListEvent: function () {
                var _this = this;
                _this.find("li input").focus(function (e) {
                    var input = $(this);
                    input.data("old", input.val());
                });
                _this.find("li input").blur(function (e) {
                    var input = $(this);
                    if (input.val() !== "") {
                        if (input.parent().is(':last-child')) {
                            opts.list.push(input.val());
                        }
                        else {
                            opts.list.splice(opts.list.indexOf(input.data("old")), 1, input.val());
                        }
                    }
                    var bwlist = cloudacl.bwListHelper.clean_list(opts.list);

                    setTimeout(function () { _this.loadlist(bwlist); }, 300);
                });
                _this.find("li span").click(function (e) {
                    var url = $(this).parent().find("input").first().val();
                    if (url !== "" && opts.list.indexOf(url) >= 0) {
                        opts.list.splice(opts.list.indexOf(url), 1);
                        $(this).parent().remove();
                    }
                });
            }
        };

        $dstObj = $.extend($dstObj, pubFunctions);

        $dstObj.loadlist(opts.list);

        return $dstObj;

    };
    $.fn.urllist.defaults = {
        list: [],
        className: "urllist",
        width: 520,
        delWidth: 60,
        rowHeight: 60
    };

})(jQuery);