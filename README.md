# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

# Chat App

## Architecture

chat-app/
│── src/               # Code source React
│   ├── components/    # Composants réutilisables (Boutons, Formulaires, Modals)
│   ├── pages/         # Pages principales (Login, Register, Home, Chat)
│   ├── services/      # Gestion des requêtes API (authentification, récupération des channels)
│   ├── context/       # Gestion du contexte global (authentification, état du chat)
│   ├── hooks/         # Hooks personnalisés (gestion du JWT, requêtes API)
│   ├── utils/         # Fonctions utilitaires (formatage, validation, sécurité)
│   ├── styles/        # Fichiers de styles (CSS, SCSS ou styled-components)
│   ├── routers/       # Configuration de React Router
│   ├── App.js         # Point d’entrée de l’application
│   ├── index.js       # Rendu React et intégration du router
    │── setupTests.js  # Fichier de configuration pour les tests
│── public/            # Fichiers statiques (index.html, favicon)
│── package.json       # Dépendances et scripts de l’application
│── .env               # Variables d’environnement (URL API, clés secrètes)
│── README.md          # Documentation du projet

📂 private-message-service/ (Microservice dédié aux messages privés)
 ├── 📜 server.js → Fichier principal du serveur
 ├── 📜 .env → Variables d'environnement (ports, clés)

📂 security/ (Gestion du cryptage RSA)
 │ ├── 📜 cryptoUtils.js → Fonctions de chiffrement/déchiffrement
 │ ├── 📂 keys/ → Stockage sécurisé des clés RSA
 │ ├── 🔑 private.pem → Clé privée RSA-2
 │ ├── 🔓 public.pem → Clé publique RSA-2

📂 db/ (Connexion et requêtes MySQL)
 │ ├── 📜 db.js → Gestion des connexions à MySQL

📂 api/ (Définition des routes API)
 │ ├── 📜 privateMessageRoutes.js → Routes pour les messages privés

📂 controllers/ (Gestion des fonctionnalités)
 │ ├── 📜 privateMessageController.js → Logique d'envoi/réception des MP

📂 middleware/ (Protection et validation des requêtes)
 │ ├── 📜 authMiddleware.js → Vérification du JWT
 │ ├── 📜 verifyAuthor.js → Vérification du propriétaire du MP

📂 sockets/ (Gestion du temps réel)
 │ ├── 📜 privateMessageSocket.js → Événements WebSocket pour MP
