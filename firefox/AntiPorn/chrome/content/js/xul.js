(function ($) {
    "use strict";
    try {
        cloudaclAntiPorn.urlPolicyInit();
        window.addEventListener("load", function () { cloudaclAntiPorn.init(); }, false);
        window.addEventListener("unload", function () { cloudaclAntiPorn.uninit(); }, false);
        $.syncHelper.schedule_sync(1000);
    } catch (e) {
    }
})(cloudacl);
