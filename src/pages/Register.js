import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/register.css';  // Import global des styles

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const response = await fetch("http://127.0.0.1:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Compte créé avec succès !");
      navigate("/"); // Redirige vers la connexion
    } else {
      alert("Erreur d'inscription : " + data.message);
    }
  };

  return (
    <section className="register-section flex-column-center">
    <div className="register-container flex-column-center neon-box">
      <h1> Bienvenu sur J-Chat</h1>
      <h2>Inscription</h2>
      <p>Bonjour, inscrivez-vous pour commencer à discuter !</p>
      <form onSubmit={handleRegister} className="formulaire flex-column-center">
        <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">S'inscrire</button>
      </form>
      <p>Déjà inscrit ? <a href="/">Se connecter</a></p>
    </div>
    </section>
  );
}

export default Register;
