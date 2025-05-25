import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    const [role, setRole] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("role");

        if (!token) {
            navigate("/login"); // 🔒 Redirection si pas connecté
        } else {
            setRole(userRole); // ✅ Stocke le rôle pour gérer l'affichage
        }
    }, [navigate]);

    return (
        <div>
            <h2>Bienvenue ! 🎉</h2>

            {/* 🔥 Ce bouton est visible uniquement pour le superadmin */}
            {role === "superadmin" && (
                <button onClick={() => navigate("/register-admin")}>Créer un Admin</button>
            )}
        </div>
    );
}

export default Home;
