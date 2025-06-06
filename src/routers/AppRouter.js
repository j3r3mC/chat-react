import { BrowserRouter as Router, Routes, Route/*, Navigate */} from "react-router-dom"; 
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import AdminRegister from "../pages/AdminRegister";
import ProtectedRoute from "../components/ProtectedRoute"; // 🔥 Modifier le chemin ici
import CreateChannel from "../pages/CreateChannel"; // 🔥 Modifier le chemin ici
import ChatRoom from "../pages/ChatRoom"; // 🔥 Modifier le chemin ici
import PrivateChat from "../pages/PrivateChat"; // 🔥 Modifier le chemin ici



function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-admin" element={<ProtectedRoute allowedRoles={["superadmin"]}><AdminRegister /></ProtectedRoute>} />
                <Route path="/create-channel" element={<ProtectedRoute allowedRoles={["admin"]}><CreateChannel /></ProtectedRoute>} />
                <Route path="/chat/:channelId" element={<ChatRoom />} />
                <Route path="/private-chat/:userId" element={<PrivateChat />} />
                <Route path="/home" element={<Home />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;
