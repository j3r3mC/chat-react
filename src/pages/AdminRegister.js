import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminRegister() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegisterAdmin = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token"); // 🔥 Récupère le token du superadmin

        if (!token) {
            alert("Accès refusé : Vous devez être superadmin !");
            return;
        }

        const response = await fetch("http://localhost:5000/api/auth/register-admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // 🔥 Envoie le token pour vérifier le rôle
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Admin créé avec succès !");
            navigate("/home"); // 🔥 Redirection vers la page d'accueil
        } else {
            alert(data.message || "Échec de l'inscription");
        }
    };

    return (
        <div>
            <h2>Créer un Administrateur</h2>
            <form onSubmit={handleRegisterAdmin}>
                <input type="text" placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Créer Admin</button>
            </form>
        </div>
    );
}

export default AdminRegister;
