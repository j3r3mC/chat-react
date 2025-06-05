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
  const [selectedFile, setSelectedFile] = useState(null);
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId && storedUserId !== "null" && storedUserId !== "undefined") {
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
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setMessages(data.map((msg) => ({
          ...msg,
          version: msg.updated_at || msg.created_at,
          id: Number(msg.id),
        })));
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des messages :", error);
      }
    };

    fetchMessages();
    socket.emit("join channel", { channel_id: channelId });

    const addMessageIfNotExists = (msg) => {
      setMessages((prevMessages) => {
        const exists = prevMessages.some((m) => Number(m.id) === Number(msg.id));
        return exists ? prevMessages : [...prevMessages, { ...msg, version: Date.now() }];
      });
    };

    socket.on("chat message", addMessageIfNotExists);
    socket.on("file message", addMessageIfNotExists);
    socket.on("update message", addMessageIfNotExists);
    
    socket.on("delete message", ({ messageId }) => {
      setMessages((prevMessages) => prevMessages.filter((msg) => Number(msg.id) !== Number(messageId)));
    });

    return () => {
      socket.off("chat message");
      socket.off("file message");
      socket.off("update message");
      socket.off("delete message");
    };
  }, [channelId, token]);

  // ✅ Envoi d'un message texte
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
          Authorization: `Bearer ${token}`,
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

  // ✅ Préparer un message pour édition
  const startEditing = (msg) => {
    setEditingMsg(msg);
    setNewMsg(msg.content);
  };

  // ✅ Modifier un message existant
  const updateMessage = async () => {
    if (!editingMsg) return;
    try {
      const response = await fetch(`http://localhost:5000/api/chat/message/${editingMsg.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMsg }),
      });
      if (!response.ok) {
        console.error("❌ Erreur lors de la mise à jour du message :", await response.text());
        return;
      }
      const updatedMessage = await response.json();
      socket.emit("update message", updatedMessage);
      setEditingMsg(null);
      setNewMsg("");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour :", error);
    }
  };

  // ✅ Suppression d'un message (admin ou auteur)
  const handleDeleteMessage = async (msgId) => {
    try {
      await fetch(`http://localhost:5000/api/chat/message/${msgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit("delete message", { messageId: msgId });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du message :", error);
    }
  };
// ✅ Envoi d'un fichier sans duplication
const sendFile = async () => {
  if (!selectedFile || !token) {
    alert("Sélectionne un fichier et connecte-toi !");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("channel_id", channelId);

  try {
    const response = await fetch("http://localhost:5000/api/chat/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      console.error("❌ Erreur lors de l'envoi du fichier :", await response.text());
      return;
    }

    const fileMessage = await response.json();
    socket.emit("file message", fileMessage);
    setSelectedFile(null);
  } catch (error) {
    console.error("❌ Erreur d'upload :", error);
  }
};
socket.on("update message", (updatedMsg) => {
  console.log("📝 WebSocket - Message mis à jour reçu :", updatedMsg);

  setMessages((prevMessages) => 
    prevMessages.map((msg) =>
      Number(msg.id) === Number(updatedMsg.id) 
        ? { ...msg, content: updatedMsg.content, version: Date.now() } 
        : msg
    )
  );
});
socket.on("update message", (updatedMsg) => {
  console.log("📝 WebSocket - Mise à jour reçue par le receveur :", updatedMsg);

  setMessages((prevMessages) => 
    prevMessages.map((msg) =>
      Number(msg.id) === Number(updatedMsg.id) 
        ? { ...msg, content: updatedMsg.content, version: Date.now() } 
        : msg
    )
  );
});


  return (
    <div>
      <h2>Salon - Channel {channelId}</h2>
      <ul>
        {messages.map((msg) => (
          <li key={`${msg.id}-${msg.version}`}>
            <strong>{msg.username}</strong>: {msg.content}{" "}
            
            {/* ✅ Autorisation pour modifier */}
            {Number(msg.user_id) === Number(userId) && (
              <button onClick={() => startEditing(msg)}>✏️ Modifier</button>
            )}

            {/* ✅ Autorisation pour supprimer (admin ou auteur) */}
            {(role === "admin" || Number(msg.user_id) === Number(userId)) && (
              <button onClick={() => handleDeleteMessage(msg.id)}>🗑️ Supprimer</button>
            )}

            {/* ✅ Affichage des fichiers */}
            {msg.file_url && (
              <div>
                {/\.(jpeg|jpg|gif|png)$/i.test(msg.file_url) ? (
                  <img
                    src={`http://localhost:3002${msg.file_url}`}
                    alt="Pièce jointe"
                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                  />
                ) : (
                  <a href={`http://localhost:3002${msg.file_url}`} target="_blank" rel="noopener noreferrer">
                    📎 Voir la pièce jointe
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div>
        <input type="text" placeholder="Écrire un message..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)} />
        <button onClick={editingMsg ? updateMessage : sendMessage}>{editingMsg ? "Modifier" : "Envoyer"}</button>
      </div>

      <div>
        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
        <button onClick={sendFile}>📎 Envoyer une pièce jointe</button>
      </div>
    </div>
  );
}

export default ChatRoom;
