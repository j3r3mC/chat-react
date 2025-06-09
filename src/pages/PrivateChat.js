import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

// Instanciation unique du socket (idéalement dans un module séparé)
const socket = io("http://localhost:5002");

function PrivateChat() {
  const { userId } = useParams(); // L'ID de l'interlocuteur
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  // Pour gérer l'édition : id du message en édition et contenu temporaire
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");

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
          { headers: { Authorization: `Bearer ${token}` } }
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

    // Gestion de l'événement socket pour les nouveaux messages
    const handleNewPrivateMessage = (msg) => {
      console.log("📩 Nouveau message reçu via WebSocket :", msg);
      setMessages((prevMessages) => {
        // Si le message existe déjà, on ne l'ajoute pas
        if (prevMessages.some((m) => String(m.id) === String(msg.id))) {
          return prevMessages;
        }
        // On n'ajoute pas le message si c'est celui de l'expéditeur (dupliqué)
        if (String(msg.sender_id) === String(currentUserId)) {
          return prevMessages;
        }
        return [...prevMessages, msg];
      });
    };

    socket.on("new private message", handleNewPrivateMessage);

    // Écoute de la mise à jour et de la suppression via Socket
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

    return () => {
      socket.off("new private message", handleNewPrivateMessage);
      socket.off("update private message");
      socket.off("delete private message");
    };
  }, [userId, currentUserId]);

  // Envoi d'un nouveau message
  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/private-messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId: currentUserId, receiverId: userId, message: newMessage }),
      });

      if (!response.ok) throw new Error("Erreur envoi MP");
      const data = await response.json();
      // Ajout immédiat du message dans l'état local
      setMessages((prevMessages) => [...prevMessages, data.message]);
      setNewMessage("");

      // Émission en temps réel
      socket.emit("send private message", data.message);
    } catch (error) {
      console.error("Erreur envoi MP :", error);
    }
  };

  // Passage en mode édition pour un message
  const handleEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  // Sauvegarde de la modification
  const saveEdit = async (messageId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/private-messages/update/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du message");
      
      // Mise à jour locale de l'état
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          String(msg.id) === String(messageId) ? { ...msg, content: editContent } : msg
        )
      );
      // Émission de l'événement de mise à jour côté socket
      socket.emit("update private message", { messageId, content: editContent });
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Erreur en update MP :", error);
    }
  };

  // Suppression d'un message
  const handleDelete = async (messageId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:5000/api/private-messages/delete/${messageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Erreur lors de la suppression du message");

      // Mise à jour locale de l'état
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => String(msg.id) !== String(messageId))
      );
      // Émission de l'événement de suppression
      socket.emit("delete private message", { messageId });
    } catch (error) {
      console.error("Erreur en suppression MP :", error);
    }
  };

  return (
    <div>
      <h2>💬 Conversation avec {userId}</h2>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id} style={{ textAlign: String(msg.sender_id) === String(currentUserId) ? "right" : "left" }}>
            {editingMessageId === msg.id ? (
              <>
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <button onClick={() => saveEdit(msg.id)}>Save</button>
                <button onClick={() => setEditingMessageId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{msg.content}</span>
                {String(msg.sender_id) === String(currentUserId) && (
                  <>
                    <button onClick={() => handleEdit(msg)}>Edit</button>
                    <button onClick={() => handleDelete(msg.id)}>Delete</button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Envoyer</button>
      </div>
    </div>
  );
}

export default PrivateChat;
