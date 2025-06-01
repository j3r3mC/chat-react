import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:3002");

function ChatRoom() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [userId, setUserId] = useState(null);
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // ✅ Correction : Chargement sécurisé de `userId`
    const storedUserId = localStorage.getItem("user_id");
    console.log("📥 Chargement du userId depuis localStorage :", storedUserId);

    if (storedUserId && storedUserId !== "null" && storedUserId !== "undefined" && storedUserId !== "") {
      setUserId(Number(storedUserId)); 
    }

    // Récupération des messages
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
        setMessages(data);
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des messages :", error);
      }
    };

    fetchMessages();
    socket.emit("join channel", { channel_id: channelId });

    socket.on("chat message", (msg) => {
      console.log("📥 Nouveau message reçu via WebSocket :", msg);
      setMessages((prevMessages) =>
        prevMessages.some((m) => m.id === msg.id) ? prevMessages : [...prevMessages, msg]
      );
    });

    socket.on("delete message", ({ messageId }) => {
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== Number(messageId)));
    });

    socket.on("delete all messages", ({ channelId: chId }) => {
      if (chId === channelId) {
        setMessages([]);
      }
    });

    return () => {
      socket.off("chat message");
      socket.off("delete message");
      socket.off("delete all messages");
    };
  }, [channelId, token]);

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

    const data = await response.json();
    console.log("✅ Message envoyé :", data);

    setNewMsg(""); // ✅ Efface l’input après l'envoi 🔥
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du message :", error);
  }
};


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
      
      {role === "admin" && (
        <button onClick={() => {
          fetch(`http://localhost:5000/api/chat/messages/channel/${channelId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
          });
        }}>
          Supprimer tous les messages
        </button>
      )}

      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            <strong>{msg.username}</strong>: {msg.content}{" "}
            <em>({new Date(msg.created_at).toLocaleString()})</em>
            {/* ✅ Correction : Vérification admin ou auteur */}
            {role === "admin" || Number(msg.user_id) === Number(userId) ? (
              <button onClick={() => handleDeleteMessage(msg.id)}>🗑️ Supprimer</button>
            ) : null}
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
        <button onClick={sendMessage}>Envoyer</button>
      </div>
    </div>
  );
}

export default ChatRoom;
