import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:3002");

function ChatRoom() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Récupération de l'historique via l'API
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ Aucun token trouvé, redirection vers la connexion.");
        window.location.href = "/login";
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/chat/messages/${channelId}`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) {
          console.error(`❌ Erreur API (${response.status}): ${await response.text()}`);
          return;
        }
        const data = await response.json();
        console.log("🕰️ Messages reçus via API :", data);
        // Remplace complètement l'état des messages avec l'historique récupéré
        setMessages(data);
      } catch (error) {
        console.error("❌ Erreur de récupération des messages :", error);
      }
    };

    fetchMessages();

    // Rejoindre le canal en indiquant de ne pas récupérer l'historique via WebSocket
    socket.emit("join channel", { channel_id: channelId, skipHistory: true });

    // Réception des nouveaux messages en temps réel
    const handleChatMessage = (msg) => {
      console.log("📩 Nouveau message reçu via WebSocket :", msg);
      if (msg && msg.content) {
        setMessages((prevMessages) => {
          // On ajoute le message s'il n'existe pas déjà (vérification par id)
          if (!prevMessages.some((m) => m.id === msg.id)) {
            return [...prevMessages, msg];
          }
          return prevMessages;
        });
      }
    };

    socket.on("chat message", handleChatMessage);

    // Nettoyage de l'écouteur lors du démontage
    return () => {
      socket.off("chat message", handleChatMessage);
    };
  }, [channelId]);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Aucun token trouvé, merci de vous reconnecter.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage, channel_id: channelId }),
      });
      if (!response.ok) {
        console.error(
          `❌ Erreur lors de l'envoi du message (${response.status}): ${await response.text()}`
        );
        alert("Erreur d'envoi du message.");
        return;
      }
      const data = await response.json();
      console.log("✅ Message envoyé :", data);
      if (data.content) {
        // SUPPRESSION : Ne pas émettre le message via socket depuis le client.
        // Le serveur émet déjà le message après insertion dans la base.
        /*
        socket.emit("chat message", data);
        */
        // Mise à jour locale si nécessaire (vérification par id)
        setMessages((prevMessages) => {
          if (!prevMessages.some((m) => m.id === data.id)) {
            return [...prevMessages, data];
          }
          return prevMessages;
        });
        setNewMessage("");
      } else {
        alert(data.message || "Échec de l'envoi du message");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi du message :", error);
    }
  };

  return (
    <div>
      <h2>Salon de discussion - Channel {channelId}</h2>
      {messages.length > 0 ? (
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>{msg.user_id}</strong>: {msg.content}{" "}
              <em>({new Date(msg.created_at).toLocaleString()})</em>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun message disponible ou en cours de chargement...</p>
      )}
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

export default ChatRoom;
