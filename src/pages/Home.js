import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState(""); // Stocke le rôle de l'utilisateur
  const [channels, setChannels] = useState([]); // Stocke les canaux
  const [joinedChannels, setJoinedChannels] = useState([]); // Stocke les canaux rejoints
  const [users, setUsers] = useState([]); // Stocke la liste des utilisateurs

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
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
  }, [navigate]);

  // 🔥 Fonction pour rejoindre un canal
  const joinChannel = async (channelId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/channels/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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

  // 🔥 Fonction pour supprimer un channel (accessible uniquement aux admins)
  const deleteChannel = async (channelId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/channels/channel/${channelId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      setChannels(channels.filter(channel => channel.id !== channelId)); // Met à jour la liste
    } catch (error) {
      console.error("Erreur lors de la suppression du channel :", error);
    }
  };

  // 🔥 Fonction pour supprimer un utilisateur (accessible uniquement aux admins)
  const deleteUser = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/admin/user/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      setUsers(users.filter(user => user.id !== userId)); // Met à jour la liste
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur :", error);
    }
  };

  return (
    <div>
      <h2>Bienvenue ! 🎉</h2>
      
      {/* 🔥 Liste des Channels */}
      <h3>Liste des Channels</h3>
      <ul>
        {channels.map((channel) => (
          <li key={channel.id} style={{ marginBottom: "1rem" }}>
            <span>
              {channel.name} - {channel.type} - {channel.access}
            </span>{" "}
            {joinedChannels.includes(channel.id) ? (
              <button onClick={() => navigate(`/chat/${channel.id}`)}>Entrer</button>
            ) : (
              <button onClick={() => joinChannel(channel.id)}>Rejoindre</button>
            )}

            {/* 🔥 Le bouton "Supprimer" est visible uniquement pour les admins */}
            {role === "admin" && (
              <button onClick={() => deleteChannel(channel.id)}>❌ Supprimer</button>
            )}
          </li>
        ))}
      </ul>

      {/* 🔥 Liste des utilisateurs (visible par tous) */}
      <h3>Utilisateurs Inscrits</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} {" "}
            {role === "admin" && (
              <button onClick={() => deleteUser(user.id)}>❌ Supprimer</button>
            )}
          </li>
        ))}
      </ul>

      {/* 🔥 Options supplémentaires pour les admins */}
      {role === "admin" && (
        <button onClick={() => navigate("/create-channel")}>Créer un Channel</button>
      )}
    </div>
  );
}

export default Home;
