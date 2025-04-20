import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';
import { IconButton } from '@mui/material';
import "../styles/History.css"; // Importing custom CSS for styling
import server from '../environment.js'; // Importing server configuration

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext); // Context for auth
    const [meetings, setMeetings] = useState([]); // State to store meetings
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token"); // Get token from local storage
                const response = await axios.get(`${server}/api/v1/users/get_all_activity`, {
                    params: { token: token }
                });
                console.log("History fetched successfully:", response.data);
                setMeetings(response.data); // Update state with fetched data
            } catch (error) {
                console.error("Failed to fetch history:", error);
            }
        };

        fetchHistory(); // Call function to fetch history when component mounts
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="history-container">
            <div className="header">
                <IconButton onClick={() => routeTo("/home")} className="home-button">
                    <HomeIcon />
                </IconButton>
                <Typography variant="h5" className="title">Meeting History</Typography>
            </div>

            {/* Render meetings if available */}
            {meetings.length !== 0 ? (
                <div className="meetings-list">
                    {meetings.map((e, i) => (
                        <Card key={i} variant="outlined" className="meeting-card">
                            <CardContent>
                                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                    Code: {e.meetingcode}
                                </Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Typography variant="h6" color="text.secondary" className="no-history">
                    No meeting history available.
                </Typography>
            )}
        </div>
    );
}


