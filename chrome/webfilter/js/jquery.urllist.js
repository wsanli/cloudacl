;String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (curlyBrack, index) {
        return ((curlyBrack == "{{") ? "{" : ((curlyBrack == "}}") ? "}" : args[index]));
    });
};
(function ($) {
    $.urllist = $.urllist || { 
        name: "UrlList",
        version: "v1.0.0",
        author: "swang@cloudacl.com",
        license: "GPL"
        }
    $.fn.urllist = function (sel, options) {
        var opts = $.extend({}, $.fn.urllist.defaults, options || {});

        //some shared varibles
        var strLI = '<li><input style="width:{0}px" type="text" value="{1}" /><span>[x]</span></li>';
        var inputWidth = (opts.width - opts.delWidth).toString();
        var $selObj = this;
        var $dstObj = jQuery(sel);

        //ul style, clean
        $dstObj.addClass(opts.className);
        $dstObj.css("width", opts.width);
        $dstObj.empty();

        var pubFunctions = {
            getlist: function(){
                return opts.list;
            },
            loadlist: function(urls){
                opts.list = [];
                $dstObj.empty();
                for (i in urls) {
                    var obj = urls[i];
                    if (obj && obj.length > 0) {
                        var li = $(strLI.format(inputWidth, obj.toString()));
                        li.appendTo($dstObj);

                        opts.list.push(obj.toString());
                    }
                }
                var newline = strLI.format(inputWidth, "");
                $(newline).appendTo($dstObj);

                this.addListEvent();
            },
            addListEvent: function(){
                var _this = this;
                _this.find("li input").focus(function(e){
                    var input = $(this);
                    input.data("old", input.val());
                });
                _this.find("li input").blur(function(e){
                	console.log('on blur');
                    var input = $(this);
                    console.log(input.data("old"));
                    if(input.val() != ""){
                        if(input.parent().is(':last-child')){
                            opts.list.push(input.val());
                        }
                        else{
                            opts.list.splice(opts.list.indexOf(input.data("old")), 1, input.val());
                        }
                    }
                    console.log(opts.list);
                    bwlist = bwList.clean_list(opts.list);
                    console.log('updated opt list');
                    setTimeout((function(){ _this.loadlist(bwlist);}).bind(_this), 300);
                });
                _this.find("li span").click(function(e){
                    var url =  $(this).parent().find("input").first().val();
                    if(url != "" && opts.list.indexOf(url) >= 0){
                        opts.list.splice(opts.list.indexOf(url), 1);
                        $(this).parent().remove();
                    }
                });
            }
        }
        
        //extend to expose function
        $dstObj = $.extend($dstObj, pubFunctions);
        
        //load from opt.list
        $dstObj.loadlist(opts.list);
        //$.fn.urllist.addListEvent($dstObj);
        
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

