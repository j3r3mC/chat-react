import { BrowserRouter as Router, Routes, Route/*, Navigate */} from "react-router-dom"; 
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";



function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;
