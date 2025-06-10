import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

// Instanciation unique du socket
const socket = io("http://localhost:5002");

function PrivateChat() {
  const { userId } = useParams(); // ID de l'interlocuteur
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Détermination de l'ID de l'utilisateur courant depuis le token
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
    // Récupération des messages via l'API
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/private-messages/get/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Erreur de récupération des messages privés");
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error("Erreur chargement MP :", error);
      }
    };

    fetchMessages();

    // Écoute des nouveaux messages texte
    const handleNewPrivateMessage = (msg) => {
      const tkn = localStorage.getItem("token");
      const senderId = JSON.parse(atob(tkn.split(".")[1])).id;
      if (msg.sender_id !== senderId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    // Écoute des nouveaux messages fichiers
    const handleNewPrivateFile = (msg) => {
      const tkn = localStorage.getItem("token");
      const senderId = JSON.parse(atob(tkn.split(".")[1])).id;
      if (msg.sender_id !== senderId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("new private message", handleNewPrivateMessage);
    socket.on("new private file", handleNewPrivateFile);

    socket.on("update private message", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(data.messageId)
            ? { ...m, content: data.content }
            : m
        )
      );
    });

    socket.on("delete private message", (data) => {
      setMessages((prev) =>
        prev.filter((m) => String(m.id) !== String(data.messageId))
      );
    });

    return () => {
      socket.off("new private message", handleNewPrivateMessage);
      socket.off("new private file", handleNewPrivateFile);
      socket.off("update private message");
      socket.off("delete private message");
    };
  }, [userId, currentUserId]);

  // Envoi d'un message texte
  const sendTextMessage = async () => {
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
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      socket.emit("send private message", data.message);
    } catch (error) {
      console.error("Erreur envoi MP :", error);
    }
  };

  // Gestion du changement de fichier et création d'une preview si c'est une image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Envoi d'un fichier en message privé
  const sendFileMessage = async () => {
    if (!selectedFile) return;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("receiverId", userId);
    formData.append("file", selectedFile);
    try {
      const response = await fetch("http://localhost:5000/api/private-messages/send-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Erreur lors de l'envoi du fichier");
      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      // Réinitialiser la sélection et la preview
      setSelectedFile(null);
      setFilePreview(null);
      socket.emit("send private file", data.message);
    } catch (error) {
      console.error("Erreur envoi fichier :", error);
    }
  };

  // Passage en mode édition pour un message texte
  const handleEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  // Sauvegarder la modification d'un message texte
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
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId) ? { ...msg, content: editContent } : msg
        )
      );
      socket.emit("update private message", { messageId, content: editContent });
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Erreur update MP :", error);
    }
  };

  // Suppression d'un message
  const handleDelete = async (messageId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/private-messages/delete/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression du message");
      setMessages((prev) =>
        prev.filter((msg) => String(msg.id) !== String(messageId))
      );
      socket.emit("delete private message", { messageId });
    } catch (error) {
      console.error("Erreur delete MP :", error);
    }
  };

  return (
    <div>
      <h2>💬 Conversation avec {userId}</h2>
      <ul>
        {messages.map((msg) => {
          if (msg.isFile) {
            // Déduire si c'est une image soit par fileType ou par extension dans fileName
            const isImage = msg.fileType?.startsWith("image/") ||
              /\.(jpg|jpeg|png|gif)$/i.test(msg.fileName);
            return (
              <li
                key={msg.id}
                style={{
                  textAlign: String(msg.sender_id) === String(currentUserId) ? "right" : "left",
                  borderBottom: "1px solid #ccc",
                  marginBottom: "10px",
                  paddingBottom: "5px",
                }}
              >
                <div>
                  <p>
                    Fichier : <strong>{msg.fileName}</strong> ({msg.fileType || "unknown"})
                  </p>
                  {isImage && (
                    <>
                      <img
                        src={`http://localhost:5000/${msg.filePath.replace(/\\/g, "/")}`}
                        alt={msg.fileName}
                        style={{
                          maxWidth: "200px",
                          maxHeight: "200px",
                          border: "1px solid #ddd",
                          marginBottom: "5px",
                        }}
                      />
                      <br />
                    </>
                  )}
                  <a
                    href={`http://localhost:5000/${msg.filePath.replace(/\\/g, "/")}`}
                    download={msg.fileName}
                  >
                    Télécharger le fichier
                  </a>
                  {String(msg.sender_id) === String(currentUserId) && (
                    <button onClick={() => handleDelete(msg.id)}>Delete</button>
                  )}
                </div>
              </li>
            );
          } else {
            return (
              <li
                key={msg.id}
                style={{
                  textAlign: String(msg.sender_id) === String(currentUserId) ? "right" : "left",
                  borderBottom: "1px solid #ccc",
                  marginBottom: "10px",
                  paddingBottom: "5px",
                }}
              >
                <div>
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
                </div>
              </li>
            );
          }
        })}
      </ul>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={sendTextMessage}>Envoyer</button>
      </div>
      <div>
        <input type="file" onChange={handleFileChange} />
        {filePreview && (
          <div style={{ margin: "10px 0" }}>
            <p>Aperçu du fichier :</p>
            <img
              src={filePreview}
              alt="Preview"
              style={{ maxWidth: "200px", maxHeight: "200px", border: "1px solid #ddd" }}
            />
          </div>
        )}
        <button onClick={sendFileMessage}>Envoyer fichier</button>
      </div>
    </div>
  );
}

export default PrivateChat;
