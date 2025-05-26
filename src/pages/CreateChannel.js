import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateChannel() {
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const navigate = useNavigate();

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Accès refusé : Vous devez être admin !");
            return;
        }

        const response = await fetch("http://localhost:5000/api/admin/channel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // 🔥 Envoie le token pour l'authentification
            },
            body: JSON.stringify({ name, type }),
        });

        const data = await response.json();
        if (response.ok) {
            alert("Channel créé avec succès !");
            navigate("/home"); // 🔥 Redirection vers l'accueil après création
        } else {
            alert(data.message || "Échec de la création du channel");
        }
    };

    return (
        <div>
            <h2>Créer un Channel</h2>
            <form onSubmit={handleCreateChannel}>
                <input type="text" placeholder="Nom du Channel" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Type du Channel" value={type} onChange={(e) => setType(e.target.value)} required />
                <button type="submit">Créer</button>
            </form>
        </div>
    );
}

export default CreateChannel;
