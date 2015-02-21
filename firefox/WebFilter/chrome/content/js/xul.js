(function ($) {
    "use strict";
    try {
        cloudaclWebFilter.urlPolicyInit();
        window.addEventListener("load", function () { cloudaclWebFilter.init(); }, false);
        window.addEventListener("unload", function () { cloudaclWebFilter.uninit(); }, false);
        $.syncHelper.schedule_sync(1000);
    } catch (e) {
    }
})(cloudacl);
