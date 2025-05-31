import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [channels, setChannels] = useState([]);
  const [joinedChannels, setJoinedChannels] = useState([]);
  const [users, setUsers] = useState([]); // Stocke la liste des utilisateurs

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
    } else {
      setRole(userRole);
    }

    // Récupérer la liste des channels
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

    // Si l'utilisateur est admin, récupérer la liste des utilisateurs
    if (userRole === "admin") {
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
    }
  }, [navigate]);

  const joinChannel = async (channelId) => {
    const token = localStorage.getItem("token");
    console.log("Tentative de rejoindre le canal avec ID :", channelId);
    try {
      const response = await fetch("http://localhost:5000/api/channels/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ channelId }),
      });
      console.log("Réponse de l'API join:", response);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur joinChannel (API):", errorData);
        throw new Error(errorData.message || "Erreur lors de la jonction");
      }
      const data = await response.json();
      console.log("Rejoint canal avec succès :", data);
      setJoinedChannels((prev) => [...prev, channelId]);
      navigate(`/chat/${channelId}`);
    } catch (error) {
      console.error("Erreur en rejoignant le canal :", error);
    }
  };

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
        throw new Error(`Erreur HTTP (${response.status}): ${await response.text()}`);
      }
      console.log(`✅ Utilisateur ${userId} supprimé`);
      setUsers(users.filter(user => user.id !== userId)); // Met à jour la liste des utilisateurs
    } catch (error) {
      console.error("❌ Erreur lors de la suppression de l'utilisateur :", error);
    }
  };

  return (
    <div>
      <h2>Bienvenue ! 🎉</h2>
      <h3>Liste des Channels</h3>
      <ul>
        {channels.map((channel) => (
          <li key={channel.id} style={{ marginBottom: "1rem" }}>
            <span>
              {channel.name} - {channel.type} - {channel.access}
            </span>
            {" "}
            {joinedChannels.includes(channel.id) ? (
              <button onClick={() => navigate(`/chat/${channel.id}`)}>
                Entrer
              </button>
            ) : (
              <button onClick={() => joinChannel(channel.id)}>
                Rejoindre
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Liste des utilisateurs visible uniquement pour les admins */}
      {role === "admin" && (
        <>
          <h3>Utilisateurs Inscrits</h3>
          <ul>
            {users.map(user => (
              <li key={user.id}>
                {user.username} {" "}
                <button onClick={() => deleteUser(user.id)}>❌ Supprimer</button>
              </li>
            ))}
          </ul>

          <button onClick={() => navigate("/create-channel")}>
            Créer un Channel
          </button>
        </>
      )}
    </div>
  );
}

export default Home;
