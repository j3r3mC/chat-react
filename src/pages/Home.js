import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [channels, setChannels] = useState([]);
  const [joinedChannels, setJoinedChannels] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
    } else {
      setRole(userRole);
    }

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
      // Redirection vers le chat correspondant
      navigate(`/chat/${channelId}`);
    } catch (error) {
      console.error("Erreur en rejoignant le canal :", error);
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
      {role === "admin" && (
        <button onClick={() => navigate("/create-channel")}>
          Créer un Channel
        </button>
      )}
    </div>
  );
}

export default Home;
