import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:3002");

function ChatRoom() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Récupération initiale des messages via l'API
    const fetchMessages = async () => {
      if (!token) {
        window.location.href = "/login";
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/chat/messages/${channelId}`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        console.log("🕰️ Messages reçus via API :", data);
        setMessages(data);
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des messages :", error);
      }
    };

    fetchMessages();

    // Rejoindre le canal pour recevoir les événements WebSocket
    socket.emit("join channel", { channel_id: channelId });

    // Écoute des nouveaux messages en temps réel
    socket.on("chat message", (msg) => {
      setMessages((prevMessages) =>
        prevMessages.some((m) => m.id === msg.id) ? prevMessages : [...prevMessages, msg]
      );
    });

    // ✅ Correction : Écoute de l'événement de suppression d'un message individuel avec conversion
    socket.on("delete message", ({ messageId }) => {
      console.log(`🗑️ Suppression reçue via WebSocket : message ID ${messageId}`);

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter((msg) => msg.id !== Number(messageId));
        console.log("🔄 Messages mis à jour après suppression :", updatedMessages);
        return [...updatedMessages]; // Force la mise à jour en créant un nouvel array
      });
    });

    // ✅ Réintégration de l'événement de suppression de tous les messages
    socket.on("delete all messages", ({ channelId: chId }) => {
      if (chId === channelId) {
        console.log("🗑️ Suppression de tous les messages reçue pour ce channel");
        setMessages([]);
      }
    });

    return () => {
      socket.off("chat message");
      socket.off("delete message");
      socket.off("delete all messages");
    };
  }, [channelId, token]);

  // ✅ Ajout de l'input pour envoyer des messages
  const sendMessage = async () => {
    if (!token) {
      alert("Veuillez vous reconnecter.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: newMsg, channel_id: channelId }),
      });
      if (!response.ok) {
        console.error("❌ Erreur lors de l'envoi du message :", await response.text());
        return;
      }
      const data = await response.json();
      console.log("✅ Message envoyé :", data);
      setNewMsg("");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi du message :", error);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/message/${msgId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error("❌ Erreur lors de la suppression du message");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'appel API pour la suppression :", error);
    }
  };

  // ✅ Réintégration de la fonction pour supprimer tous les messages du canal
  const handleDeleteAllMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/messages/channel/${channelId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error("❌ Erreur lors de la suppression de tous les messages");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'appel API pour la suppression de tous les messages :", error);
    }
  };

  return (
    <div>
      <h2>Salon - Channel {channelId}</h2>
      
      {role === "admin" && (
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={handleDeleteAllMessages}>
            Supprimer tous les messages
          </button>
        </div>
      )}

      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            <strong>{msg.username}</strong>: {msg.content}{" "}
            <em>({new Date(msg.created_at).toLocaleString()})</em>
            {role === "admin" && (
              <button onClick={() => handleDeleteMessage(msg.id)}>
                🗑️ Supprimer
              </button>
            )}
          </li>
        ))}
      </ul>
      
      {/* ✅ Correction du champ d'envoi de messages */}
      <div>
        <input
          type="text"
          placeholder="Écrire un message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
        />
        <button onClick={sendMessage}>Envoyer</button>
      </div>
    </div>
  );
}

export default ChatRoom;
