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
  const [selectedFile, setSelectedFile] = useState(null); // Pour l'upload de fichier
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // Au montage, récupération de l'user_id et des messages initiaux
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (
      storedUserId &&
      storedUserId !== "null" &&
      storedUserId !== "undefined" &&
      storedUserId !== ""
    ) {
      setUserId(Number(storedUserId));
    }

    const fetchMessages = async () => {
      if (!token) {
        window.location.href = "/login";
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:5000/api/chat/messages/${channelId}`,
          {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
          }
        );
        const data = await response.json();
        // Nous ajoutons une propriété "version" à chaque message pour la clé de rendu
        const dataWithVersion = data.map((msg) => ({
          ...msg,
          version: msg.updated_at || msg.created_at,
          id: Number(msg.id), // Forcer l'ID à être un nombre
        }));
        setMessages(dataWithVersion);
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des messages :", error);
      }
    };

    fetchMessages();
    socket.emit("join channel", { channel_id: channelId });

    // Écoute des messages texte
    socket.on("chat message", (msg) => {
      setMessages((prevMessages) => {
        const exists = prevMessages.some((m) => Number(m.id) === Number(msg.id));
        if (exists) return prevMessages;
        return [
          ...prevMessages,
          { ...msg, version: msg.created_at, id: Number(msg.id) },
        ];
      });
    });

    // Écoute des messages de pièce jointe
    socket.on("file message", (fileMsg) => {
      // Mise à jour du state en ajoutant le message de fichier
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...fileMsg, version: fileMsg.created_at || Date.now(), id: Number(fileMsg.id) },
      ]);
    });

    // Écoute des mises à jour de messages
    socket.on("update message", (updatedMsg) => {
      console.log("📝 WebSocket - Message mis à jour reçu :", updatedMsg);
      setMessages((prevMessages) => {
        const index = prevMessages.findIndex(
          (msg) => Number(msg.id) === Number(updatedMsg.id)
        );
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
          return [
            ...prevMessages,
            { ...updatedMsg, version: Date.now(), id: Number(updatedMsg.id) },
          ];
        }
      });
    });

    // Écoute de la suppression d'un message
    socket.on("delete message", ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => Number(msg.id) !== Number(messageId))
      );
    });

    return () => {
      socket.off("chat message");
      socket.off("file message");
      socket.off("update message");
      socket.off("delete message");
    };
  }, [channelId, token]);

  useEffect(() => {
    console.log("🖥️ État des messages :", messages);
  }, [messages]);

  // Envoi d'un nouveau message texte
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
        console.error(
          "❌ Erreur lors de l'envoi du message :",
          await response.text()
        );
        return;
      }
      setNewMsg("");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi du message :", error);
    }
  };

  // Préparation d'un message pour édition
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
        console.error(
          "❌ Erreur lors de la mise à jour du message :",
          await response.text()
        );
        return;
      }
      const updatedMessage = await response.json();
      console.log("✅ Mise à jour réussie, réponse :", updatedMessage);
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

  // Fonction pour envoyer un fichier (upload)
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
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        console.error(
          "❌ Erreur lors de l'envoi du fichier :",
          await response.text()
        );
        return;
      }

      const fileMessage = await response.json();
      // Pour le sender, on met à jour le state local
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...fileMessage, version: fileMessage.created_at || Date.now(), id: Number(fileMessage.id) },
      ]);
      // Et on émet l'événement pour que les autres clients le reçoivent
      socket.emit("file message", fileMessage);
      setSelectedFile(null);
    } catch (error) {
      console.error("❌ Erreur d'upload :", error);
    }
  };

  return (
    <div>
      <h2>Salon - Channel {channelId}</h2>
      <ul>
        {messages.map((msg) => (
          <li key={`${msg.id}-${msg.version}`}>
            <strong>{msg.username}</strong>: {msg.content}{" "}
            <em>
              (Modifié :{" "}
              {msg.updated_at ? new Date(msg.updated_at).toLocaleString() : "Jamais"})
            </em>
            {Number(msg.user_id) === Number(userId) && (
              <button onClick={() => startEditing(msg)}>✏️ Modifier</button>
            )}
            {(role === "admin" || Number(msg.user_id) === Number(userId)) && (
              <button onClick={() => handleDeleteMessage(msg.id)}>
                🗑️ Supprimer
              </button>
            )}
            {msg.file_url && (
              <div>
                {/\.(jpeg|jpg|gif|png)$/i.test(msg.file_url) ? (
                  <img
                    src={`http://localhost:3002${msg.file_url}`}
                    alt="Pièce jointe"
                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                  />
                ) : (
                  <a
                    href={`http://localhost:3002${msg.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📎 Voir la pièce jointe
                  </a>
                )}
              </div>
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
      <div>
        <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
        <button onClick={sendFile}>📎 Envoyer une pièce jointe</button>
      </div>
    </div>
  );
}

export default ChatRoom;
