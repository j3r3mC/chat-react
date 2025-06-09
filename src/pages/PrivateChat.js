import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

// Instanciation unique du socket (idéalement dans un module séparé pour éviter les ré-initialisations)
const socket = io("http://localhost:5002");

function PrivateChat() {
  const { userId } = useParams(); // L'ID de l'interlocuteur
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Pour déterminer l'ID de l'utilisateur courant
  const currentUserId = (() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).id;
    } catch (err) {
      return null;
    }
  })();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Récupération de l'historique des messages via l'API
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/private-messages/get/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok)
          throw new Error("Erreur de récupération des messages privés");
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error("Erreur chargement MP :", error);
      }
    };

    fetchMessages();

    // Fonction de gestion de l'événement socket
    const handleNewPrivateMessage = (msg) => {
      console.log("📩 Nouveau message reçu via WebSocket :", msg);
      // Vérifie si le message existe déjà dans le state en comparant les identifiants
      setMessages((prevMessages) => {
        if (prevMessages.some((m) => String(m.id) === String(msg.id))) {
          // Message déjà présent, ne pas l'ajouter à nouveau
          return prevMessages;
        }
        // Optionnel : on peut aussi appliquer une condition pour éviter d'ajouter le message si c'est l'émetteur lui-même, si nécessaire
        if (String(msg.sender_id) === String(currentUserId)) {
          return prevMessages;
        }
        return [...prevMessages, msg];
      });
    };

    // Écoute de l'événement 'new private message'
    socket.on("new private message", handleNewPrivateMessage);

    // Écoute des événements de mise à jour et de suppression
    socket.on("update private message", (msg) => {
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          String(m.id) === String(msg.messageId) ? { ...m, content: msg.content } : m
        )
      );
    });

    socket.on("delete private message", (msg) => {
      setMessages((prevMessages) =>
        prevMessages.filter((m) => String(m.id) !== String(msg.messageId))
      );
    });

    // Nettoyage lors du démontage du composant
    return () => {
      socket.off("new private message", handleNewPrivateMessage);
      socket.off("update private message");
      socket.off("delete private message");
    };
  }, [userId, currentUserId]);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/private-messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: userId,
          message: newMessage,
        }),
      });

      if (!response.ok) throw new Error("Erreur envoi MP");
      const data = await response.json();
      // Ajoute immédiatement le message dans l'état local
      setMessages((prevMessages) => [...prevMessages, data.message]);
      setNewMessage("");

      // Émission de l'événement en temps réel côté client
      socket.emit("send private message", data.message);
    } catch (error) {
      console.error("Erreur envoi MP :", error);
    }
  };

  return (
    <div>
      <h2>💬 Conversation avec {userId}</h2>
      <ul>
        {messages.map((msg, index) => (
          <li
            key={index}
            style={{
              textAlign:
                String(msg.sender_id) === String(currentUserId) ? "right" : "left",
            }}
          >
            {msg.content}
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Écrire un message..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Envoyer</button>
    </div>
  );
}

export default PrivateChat;
