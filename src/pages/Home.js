import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css"; // Import des styles spécifiques à la page d'accueil

// Fonction pour regrouper les messages privés par interlocuteur
// On considère que si l'utilisateur courant est l'expéditeur, l'interlocuteur est le destinataire, sinon inversement.
const groupConversations = (messages, currentUserId) => {
  const conversations = {};
  messages.forEach((msg) => {
    const interlocutorId =
      String(msg.sender_id) === String(currentUserId)
        ? msg.receiver_id
        : msg.sender_id;
    // On suppose que l'API envoie sender_username et receiver_username.
    const interlocutorName =
      String(msg.sender_id) === String(currentUserId)
        ? msg.receiver_username || "Inconnu"
        : msg.sender_username || "Inconnu";
    
    if (!conversations[interlocutorId]) {
      conversations[interlocutorId] = {
        id: interlocutorId,
        interlocutorId,
        interlocutorName,
        lastMessage: msg.content,
        updated_at: msg.updated_at || msg.created_at,
      };
    } else {
      if (new Date(msg.updated_at || msg.created_at) > new Date(conversations[interlocutorId].updated_at)) {
        conversations[interlocutorId].lastMessage = msg.content;
        conversations[interlocutorId].updated_at = msg.updated_at || msg.created_at;
      }
    }
  });
  return Object.values(conversations);
};

function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState(""); // Rôle de l'utilisateur
  const [channels, setChannels] = useState([]); // Tous les channels disponibles
  const [joinedChannels, setJoinedChannels] = useState([]); // Channels rejoints
  const [users, setUsers] = useState([]); // Liste des utilisateurs
  const [privateChats, setPrivateChats] = useState([]); // Discussions privées

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    } else {
      setRole(userRole);
    }

    // 🔍 Récupération des channels
    const fetchChannels = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/channels/all");
        if (!response.ok) {
          throw new Error(`Erreur HTTP (${response.status}): ${await response.text()}`);
        }
        const data = await response.json();
        setChannels(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des channels :", error);
      }
    };
    fetchChannels();

    // 🔍 Récupération des utilisateurs
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Erreur HTTP (${response.status}): ${await response.text()}`);
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
      }
    };
    fetchUsers();

    // 🔍 Récupération des discussions privées
const fetchPrivateChats = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/private-messages/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des discussions privées");
    }
    const data = await response.json();
    console.log("Messages privés bruts :", data.conversations);  
    const messages = data.conversations || []; // On récupère le tableau dans la clé "conversations"
    const currentUserId = JSON.parse(atob(token.split(".")[1])).id;
    const grouped = groupConversations(messages, currentUserId);
    setPrivateChats(grouped);
  } catch (error) {
    console.error("Erreur lors de la récupération des discussions privées :", error);
  }
};


    fetchPrivateChats();
  }, [navigate]);

  // 🔥 Fonction pour rejoindre un channel
  const joinChannel = async (channelId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/channels/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ channelId }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la jonction");
      }
      setJoinedChannels((prev) => [...prev, channelId]);
      navigate(`/chat/${channelId}`);
    } catch (error) {
      console.error("Erreur en rejoignant le canal :", error);
    }
  };

  // 🔥 Fonction pour supprimer un channel (accessible aux admins)
  const deleteChannel = async (channelId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/channels/channel/${channelId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      setChannels(channels.filter((channel) => channel.id !== channelId));
    } catch (error) {
      console.error("Erreur lors de la suppression du channel :", error);
    }
  };

  // 🔥 Fonction pour supprimer un utilisateur (accessible aux admins)
  const deleteUser = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/admin/user/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur :", error);
    }
  };

  return (
<div className="home-container">
  <h1>Accueil</h1>
  {/* 👋 Message de bienvenue personnalisé */}
  <p className="welcome-message">
    Bienvenue cher {role === "admin" ? "administrateur" : users.find(u => String(u.id) === String(JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id))?.username || "utilisateur"} !
  </p>

     
      <div className="section-container">
      {/* Liste des utilisateurs */}
      <section>
        <h3>Utilisateurs Inscrits</h3>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <p>
              {user.username}</p>
              <button onClick={() => navigate(`/private-chat/${user.id}`)}>💬 MP</button>
              {role === "admin" && (
                <button onClick={() => deleteUser(user.id)}>❌ Supprimer</button>
              )}
            </li>
          ))}
        </ul>
      </section>

    

      {/* Liste des channels */}
      <section>
        <h3>Liste des Channels</h3>
        <ul>
          {channels.map((channel) => (
            <li key={channel.id} style={{ marginBottom: "1rem" }}>
              <p>
              <span>
                {channel.name} - {channel.type} - {channel.access}
              </span></p>{" "}  
              {joinedChannels.includes(channel.id) ? (
                <button onClick={() => navigate(`/chat/${channel.id}`)}>Entrer</button>
              ) : (
                <button onClick={() => joinChannel(channel.id)}>Rejoindre</button>
              )}
              {role === "admin" && (
                <button onClick={() => deleteChannel(channel.id)}>❌ Supprimer</button>
              )}
            </li>
          ))}
        </ul>
        {role === "admin" && (
          <button onClick={() => navigate("/create-channel")}>Créer un Channel</button>
        )}
      </section>
        {/* Liste des discussions privées */}
      {/* Liste des discussions privées */}
<section>
  <h3>💬 Discussions Privées</h3>
  {privateChats.length > 0 ? (
    <ul>
      {privateChats.map((chat) => (
        <li key={chat.id}>
          <button onClick={() => navigate(`/private-chat/${chat.interlocutorId}`)}>
            💬 {users.find(u => String(u.id) === String(chat.interlocutorId))?.username || chat.interlocutorName}
          </button>
        </li>
      ))}
    </ul>
  ) : (
    <p>Aucune conversation privée</p>
  )}
</section>

      </div>  
    </div>
  );
}

export default Home;
