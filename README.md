# custom_chat - Frontend

**custom_chat** est une application de chat personnalisée qui permet d’échanger des messages en temps réel (publics et privés) ainsi que de partager des fichiers. Ce front-end, développé en React, communique avec l’API Gateway pour interagir avec l’ensemble des services backend.

---

## Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Architecture Frontend](#architecture-frontend)
- [Structure du Projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Endpoints et Intégration](#endpoints-et-intégration)
- [Installation et Déploiement](#installation-et-déploiement)
- [Technologies Utilisées](#technologies-utilisées)
- [Licence](#licence)

---

## Vue d'Ensemble

Le front-end de **custom_chat** offre une interface utilisateur intuitive pour :

- Se connecter et s'inscrire.
- Participer aux chats publics via différents channels.
- Échanger des messages privés, où les messages texte sont décryptés pour l’affichage (les données sensibles ayant été cryptées côté serveur).
- Envoyer et recevoir des fichiers (les images et documents sont affichés en prévisualisation et téléchargeables).

L’application utilise React avec React Router pour la navigation et Socket.io pour les mises à jour en temps réel.

---

## Architecture Frontend

Le front-end est organisé autour de composants React modulaires, de pages pour chaque vue importante ainsi que de services pour centraliser les appels API. La communication avec l’API Gateway se fait via des appels HTTP ainsi qu’en temps réel via Socket.io.

```plaintext
custom_chat-frontend/
├── build/                 # Le build compilé de l'application
├── node_modules/          # Dépendances installées
├── public/                # Fichiers statiques (index.html, images, etc.)
│   └── index.html         # Point d'entrée HTML
└── src/
    ├── components/        # Composants réutilisables (boutons, formulaires, etc.)
    ├── context/           # Contextes React pour la gestion de l'état global (authentification, thème, etc.)
    ├── hooks/             # Hooks custom pour simplifier la logique réutilisable
    ├── pages/             # Pages de l'application (Home, Login, ChatRoom, PrivateChat, etc.)
    ├── routers/           # Configuration du routeur avec React Router (ex. AppRouter.js)
    ├── services/          # Services pour les appels API vers le backend
    ├── styles/            # Feuilles de styles CSS / SCSS
    ├── utils/             # Fonctions utilitaires
    ├── App.js             # Composant principal de l'application
    └── index.js           # Point d'entrée JavaScript
Fonctionnalités
Interface Utilisateur Moderne : Conçue en React, l’interface est responsive et offre une navigation intuitive entre les différentes pages (login, chat public, discussions privées, etc.).

Chats Publics et Privés :

Participation aux channels publics créés et gérés par des administrateurs.

Discussions privées sécurisées, où les messages texte sont cryptés côté serveur (via RSA) et décryptés au moment de l’affichage.

Partage de Fichiers : Les utilisateurs peuvent envoyer des fichiers dans les chats ; ces fichiers sont affichés en prévisualisation dans le cas d’images et sont téléchargeables.

Temps Réel via Socket.io : Les mises à jour en temps réel et les notifications de nouveaux messages sont gérées grâce à Socket.io..

Endpoints et Intégration
Le front-end interagit avec le backend via l’API Gateway qui centralise les requêtes vers les microservices. Par exemple :

Pour l'authentification : POST /api/auth/login et POST /api/auth/register

Pour récupérer les messages publics et privés ainsi que pour envoyer des messages, le front-end utilise les endpoints fournis par les services Chat et Private Message.

Les fichiers uploadés sont accessibles via l’URL : http://localhost:5000/upload/{fileName}

Les appels API sont regroupés dans le dossier src/services pour faciliter la maintenance et l’évolution de l'intégration.

Installation et Déploiement
Prérequis
Node.js (v14+)

npm ou yarn

Installation
Cloner le Repository :

bash
git clone https://votre-repository-url.git
cd custom_chat-frontend
Installer les Dépendances :

bash
npm install
# ou
yarn install
Configuration :

Vérifiez que le fichier .env (si utilisé) contient les configurations nécessaires (URL de l’API Gateway, etc.).

Lancement
En Mode Développement :

bash
npm start
# ou
yarn start
Build pour Production :

bash
npm run build
# ou
yarn build
Le build sera généré dans le dossier build/, que vous pourrez ensuite déployer sur un serveur statique ou intégrer à votre API Gateway pour servir les fichiers.

Technologies Utilisées
React : Framework principal pour le développement de l’interface.

React Router : Pour la gestion de la navigation.

Socket.io Client : Pour les mises à jour en temps réel.

Axios (ou fetch) : Pour les appels HTTP vers le backend.

CSS/SCSS : Pour le style des composants et pages.

ESLint & Prettier : Pour le linting et le formatage du code.

Licence
Ce projet est sous licence MIT.
---