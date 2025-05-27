import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    const [role, setRole] = useState("");
    const [channels, setChannels] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("role");

        if (!token) {
            navigate("/login"); // 🔒 Redirection si pas connecté
        } else {
            setRole(userRole); // ✅ Stocke le rôle pour gérer l'affichage
        }

        // 🔥 Récupérer la liste des channels
        const fetchChannels = async () => {
            const response = await fetch("http://localhost:5000/api/admin/channels");
            const data = await response.json();
            setChannels(data);
        };

        fetchChannels();
    }, [navigate]);

    return (
        <div>
            <h2>Bienvenue ! 🎉</h2>

            {/* 🔥 Affichage de tous les channels */}
            <h3>Liste des Channels</h3>
            <ul>
                {channels.map(channel => (
                    <li key={channel.id}>
                        <button onClick={() => navigate(`/chat/${channel.id}`)}>
                            {channel.name} - {channel.type}
                        </button>
                    </li>
                ))}
            </ul>

            {/* 🔥 Bouton visible uniquement pour les admins */}
            {role === "admin" && (
                <button onClick={() => navigate("/create-channel")}>Créer un Channel</button>
            )}
        </div>
    );
}

export default Home;
