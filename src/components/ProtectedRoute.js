import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
        return <Navigate to="/login" />; // 🔒 Redirige si non connecté
    }

    if (!allowedRoles.includes(role)) {
        return <Navigate to="/" />; // 🔒 Redirige si le rôle est invalide
    }

    return children; // ✅ Affiche la page si autorisé
};

export default ProtectedRoute;
