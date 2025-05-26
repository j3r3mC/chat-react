import { useEffect, useState } from "react";

function AdminDashboard() {
    const [channels, setChannels] = useState([]);

    useEffect(() => {
        const fetchChannels = async () => {
            const response = await fetch("http://localhost:5000/api/admin/channels");
            const data = await response.json();
            setChannels(data);
        };

        fetchChannels();
    }, []);

    return (
        <div>
            <h2>Gestion des Channels</h2>
            <ul>
                {channels.map(channel => (
                    <li key={channel.id}>{channel.name} - {channel.type}</li>
                ))}
            </ul>
        </div>
    );
}

export default AdminDashboard;
