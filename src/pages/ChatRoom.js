import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:3002");

function ChatRoom() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [userId, setUserId] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // Au montage, récupération de l'user_id et des messages initiaux
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId && storedUserId !== "null" && storedUserId !== "undefined" && storedUserId !== "") {
      setUserId(Number(storedUserId));
    }

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
        // On ajoute une propriété "version" à chaque message pour gérer la clé du rendu
        const dataWithVersion = data.map((msg) => ({
          ...msg,
          version: msg.updated_at || msg.created_at,
          id: Number(msg.id)  // On force l'ID à être un nombre
        }));
        setMessages(dataWithVersion);
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des messages :", error);
      }
    };

    fetchMessages();
    socket.emit("join channel", { channel_id: channelId });

    // Réception d'un nouveau message
    socket.on("chat message", (msg) => {
      setMessages((prevMessages) => {
        // Conversion en nombre pour la comparaison
        const exists = prevMessages.some((m) => Number(m.id) === Number(msg.id));
        if (exists) return prevMessages;
        return [...prevMessages, { ...msg, version: msg.created_at, id: Number(msg.id) }];
      });
    });

    // Réception d'une mise à jour via WebSocket
    socket.on("update message", (updatedMsg) => {
      console.log("📝 WebSocket - Message mis à jour reçu :", updatedMsg);
      setMessages((prevMessages) => {
        // Comparaison en forçant la conversion en nombre
        const index = prevMessages.findIndex((msg) => Number(msg.id) === Number(updatedMsg.id));
        if (index > -1) {
          const oldUsername = prevMessages[index].username;
          const newMessage = {
            id: Number(updatedMsg.id),
            content: updatedMsg.content,
            updated_at: updatedMsg.updated_at,
            version: Date.now(), // Nouvelle version pour forcer le re-rendu
            username: oldUsername || updatedMsg.username || "Inconnu",
            user_id: updatedMsg.user_id || prevMessages[index].user_id,
            channel_id: updatedMsg.channel_id || prevMessages[index].channel_id,
          };
          const newMessages = [...prevMessages];
          newMessages[index] = newMessage;
          console.log("🔄 Nouveau tableau de messages :", newMessages);
          return newMessages;
        } else {
          return [...prevMessages, { ...updatedMsg, version: Date.now(), id: Number(updatedMsg.id) }];
        }
      });
    });

    // Réception de la suppression d'un message
    socket.on("delete message", ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => Number(msg.id) !== Number(messageId))
      );
    });

    return () => {
      socket.off("chat message");
      socket.off("update message");
      socket.off("delete message");
    };
  }, [channelId, token]);

  useEffect(() => {
    console.log("🖥️ État des messages :", messages);
  }, [messages]);

  // Envoi d'un nouveau message
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
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMsg, channel_id: channelId }),
      });
      if (!response.ok) {
        console.error("❌ Erreur lors de l'envoi du message :", await response.text());
        return;
      }
      setNewMsg("");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi du message :", error);
    }
  };

  // Préparation d'un message pour être édité
  const startEditing = (msg) => {
    setEditingMsg(msg);
    setNewMsg(msg.content);
  };

  // Mise à jour d'un message existant
  const updateMessage = async () => {
    if (!editingMsg) return;
    try {
      const response = await fetch(`http://localhost:5000/api/chat/message/${editingMsg.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMsg }),
      });
      if (!response.ok) {
        console.error("❌ Erreur lors de la mise à jour du message :", await response.text());
        return;
      }
      const updatedMessage = await response.json();
      console.log("✅ Mise à jour réussie, réponse :", updatedMessage);
      // On émet l'événement pour synchroniser sur tous les clients
      socket.emit("update message", updatedMessage);
      setEditingMsg(null);
      setNewMsg("");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour :", error);
    }
  };

  // Suppression individuelle d'un message
  const handleDeleteMessage = async (msgId) => {
    try {
      await fetch(`http://localhost:5000/api/chat/message/${msgId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du message :", error);
    }
  };

  return (
    <div>
      <h2>Salon - Channel {channelId}</h2>
      <ul>
        {messages.map((msg) => (
          <li key={`${msg.id}-${msg.version}`}>
            <strong>{msg.username}</strong>: {msg.content}{" "}
            <em>(Modifié : {msg.updated_at ? new Date(msg.updated_at).toLocaleString() : "Jamais"})</em>
            {Number(msg.user_id) === Number(userId) && (
              <button onClick={() => startEditing(msg)}>✏️ Modifier</button>
            )}
            {(role === "admin" || Number(msg.user_id) === Number(userId)) && (
              <button onClick={() => handleDeleteMessage(msg.id)}>🗑️ Supprimer</button>
            )}
          </li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Écrire un message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
        />
        <button onClick={editingMsg ? updateMessage : sendMessage}>
          {editingMsg ? "Modifier" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

export default ChatRoom;
