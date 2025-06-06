import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002"); // 🔥 Connexion WebSocket au serveur

function PrivateChat() {
  const { userId } = useParams(); // Récupère l'ID de l'interlocuteur
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 📩 Récupération des messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/private-messages/get/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Erreur de récupération des messages privés");
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error("Erreur chargement MP :", error);
      }
    };

    fetchMessages();

    // 📡 Écoute des nouveaux messages en WebSocket
   socket.on("new private message", (newMessage) => {
  console.log("📩 Nouveau message reçu via WebSocket :", newMessage);

  // 🔥 Vérifie que l'émetteur n'ajoute PAS son propre message une deuxième fois
  const token = localStorage.getItem("token");
  const senderId = JSON.parse(atob(token.split(".")[1])).id; 

  if (newMessage.sender_id !== senderId) {
    setMessages((prevMessages) => [...prevMessages, newMessage]); // ✅ Ajoute seulement les messages des autres
  }
});


    return () => {
      socket.off("new private message"); // ⚠️ Désinscription du WebSocket lors du démontage du composant
    };
  }, [userId]);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    const senderId = JSON.parse(atob(token.split(".")[1])).id; 

    try {
      const response = await fetch("http://localhost:5000/api/private-messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId, receiverId: userId, message: newMessage }),
      });

      if (!response.ok) throw new Error("Erreur envoi MP");
      const data = await response.json();
      setMessages([...messages, data.message]); 
      setNewMessage("");

      // 🚀 Émission du message en temps réel via WebSocket
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
          <li key={index} style={{ textAlign: msg.sender_id === "me" ? "right" : "left" }}>
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
