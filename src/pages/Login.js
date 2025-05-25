import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login(){

    const [ username, setUserName] = useState("");
    const [ password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if(response.ok){
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("userId", data.userId);
            navigate("/home");
        } else {
            alert(data.message || "Échec de la connexion");
        }
    };

    return (
        <div>
            <h1> Bienvenu dans mon app-chat J-Script</h1>
            <h2>Connexion</h2>
            <form onSubmit={handleLogin}>  {/* 🔥 Ajout de onSubmit */}   
                <input type="text" name="username" id="user_name" placeholder="Pseudo ...." value={username} onChange={(e)=> setUserName(e.target.value)} required />
                <input type="text" name="password" id="user_password" placeholder="Mot de passe ...." value={password} onChange={(e)=> setPassword(e.target.value)} required />
                <button type="submit">Se connecter</button>
            </form>
            <p>Pas encore inscrit ? <a href="/register">Créer un compte</a></p>
        </div>
    );
}

export default Login;

