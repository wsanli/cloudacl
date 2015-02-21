//// alert stuff ////
function send_alert(host, cid, rawUrl) {
    ajax_post("addon/sendalert/", { 'host': host, 'cid': cid, 'rawUrl': rawUrl },
                function (json) {
                },
                function (json) {
                });
}