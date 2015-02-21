//notification message format:

function notify(message) {
    try {

        if (message != null) {
            notifymessage = [{ 'text': message.text, 'id': message.id}];
        }

        if (notifymessage && notifymessage.length > 0) {
            var notification = webkitNotifications.createHTMLNotification(chrome.extension.getURL("notify.html"));
            if (notifyTimeout != 0) {
                setTimeout(function () {
                    notification.cancel();
                }, notifyTimeout);
            }
            notification.show();
        }
    } catch (e) {
    }
}
function check_notification() {
    $.ajax({
        type: 'GET',
        async: true,
        timeout: 15000,
        url: backendUrl + "addon/notification/",
        dataType: 'json',
        headers: { 'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest', 'X_REQUESTED_WITH': 'XMLHttpRequest', 'X-Requested-With': 'XMLHttpRequest' },
        success: function (json) {
            if (json.success && json.notifications) {
                var hids = (localStorage['history_ids'] || '').toString().split(',');
                hids = clean_sort_list(hids);
                if (hids && (hids.constructor === Array) && hids.length > 0) {
                    var notifications_new = [];
                    var ids = [];
                    for (var i = 0; i < json.notifications.length; i++) {
                        var n = json.notifications[i];
                        if (hids.indexOf(n.id.toString()) === -1) {
                            notifications_new.push(n);
                            ids.push(n.id);
                        }
                    }
                    localStorage['history_ids'] = hids.concat(ids);
                    notifymessage = notifications_new;
                }
                else {
                    var ids = [];
                    for (var i = 0; i < json.notifications.length; i++) {
                        var n = json.notifications[i];
                        ids.push(n.id);
                    }
                    localStorage['history_ids'] = ids.join(',');
                    notifymessage = json.notifications;
                }
                for (var i = 0; i < notifymessage.length; i++) {
                    notify(notifymessage[i]);
                }
            }
        }
    }).error(function (jqxhr, status, err) {
    });
}
function schedule_check_notification(startInterval) {
    if (startInterval != null) {
        window.setTimeout(check_notification, startInterval);
    } else {
        window.setTimeout(check_notification, 0);
    }
    window.setTimeout(schedule_check_notification, pollInterval);
}
