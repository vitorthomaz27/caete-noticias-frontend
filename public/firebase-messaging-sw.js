// 1. Importar os scripts necessários do Firebase
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 2. Configurar o Firebase no Service Worker
// Use os dados do seu projeto "caete-noticias-app"
firebase.initializeApp({
  apiKey: "AIzaSyCqIaL1dMKbu7GzFuA0afs0Dj6awZrQlgM",
  authDomain: "caete-noticias-app.firebaseapp.com",
  projectId: "caete-noticias-app", //
  storageBucket: "caete-noticias-app.appspot.com",
  messagingSenderId: "1091097576417", //
  appId: "1:1091097576417:web:be2fd9e0cc7b434f54c8a0",
  measurementId: "G-4ZMNV22DND"
});

const messaging = firebase.messaging();

// 3. Lógica para exibir a notificação em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em segundo plano:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png', // Caminho para a logo do seu app
    data: {
      url: payload.data.link // Link para onde o usuário vai ao clicar
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 4. Lógica para abrir o link ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
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