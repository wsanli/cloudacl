;jQuery.noConflict();
(function ($) {
    "use strict";
    $.dualtoggle = $.dualtoggle || {
        name: "DualToggle",
        version: "v1.0.0",
        author: "swang@cloudacl.com",
        license: "GPL"
    };
    $.fn.dualtoggle = function (sel1, sel2, options) {

        function addClickEvent() {
            $selObj.click(function () {
                pair[0].toggle();
                pair[1].toggle();
                $(this).text(opts.Text[pair[0].is(":visible") ? 0 : 1]);
            });
        }

        var opts = $.extend({}, $.fn.dualtoggle.defaults, options || {});

        //some shared varibles
        var $selObj = this;
        var pair = [jQuery(sel1).hide(), jQuery(sel2).hide()];
        pair[opts.init].show();
        $selObj.text(opts.Text[opts.init]);

        //style,clean up,etc
        $selObj.addClass(opts.className);
        $selObj.attr("href", "javascript:void(0)");

        addClickEvent();

        var pubFunctions = {};
        $selObj = $.extend($selObj, pubFunctions);
        return $selObj;
    };
    $.fn.dualtoggle.defaults = {
        className: "dualtoggle",
        init: 0,
        Text: ["List View", "Text View"]
    };

})(jQuery);
