self.addEventListener('push', function(event) {
    if (event.data) {
        let payload;
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { title: "New Notification", body: event.data.text() };
        }

        const title = payload.title || "Classgrid";
        const options = {
            body: payload.body || "You have a new notification.",
            icon: "/favicon.ico", // Or a specific push icon
            badge: "/favicon.ico",
            data: {
                url: payload.url || "/",
            }
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
