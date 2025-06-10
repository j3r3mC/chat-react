import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/login.css';  // Import global des styles

function Login() {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

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
    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user_id", data.userId); // Correction de la clé

      console.log("📥 Stockage réussi dans localStorage :", {
        token: localStorage.getItem("token"),
        role: localStorage.getItem("role"),
        user_id: localStorage.getItem("user_id")
      });

      navigate("/home");
    } else {
      alert(data.message || "Échec de la connexion");
    }
  };

  return (
    <section className="login-section flex-column-center">
      <div className="login-container flex-column-center neon-box">
        <h1>Bienvenu dans mon app-chat</h1>
        <h2>Connexion</h2>
        <form onSubmit={handleLogin} className="formulaire flex-column-center">
          <input
            type="text"
            name="username"
            id="user_name"
            placeholder="Pseudo ...."
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="user_password"
              placeholder="Mot de passe ...."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
           
           <button
              type="button"
              className="toggle-password"
              onClick={toggleShowPassword}
            >
              {showPassword ? "Masquer" : "Afficher mot de passe"}
            </button>
          <button type="submit">Se connecter</button>
        </form>
        <p>
          Pas encore inscrit ? <a href="/register">Créer un compte</a>
        </p>
      </div>
    </section>
  );
}

export default Login;
