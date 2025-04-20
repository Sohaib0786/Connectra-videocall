import { createContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";
import server from "../environment";
// Create AuthContext
export const AuthContext = createContext({});

// Configure Axios client
const client = axios.create({
    baseURL: `${server}/api/v1/users`, // Ensure the protocol is included
});



// AuthProvider Component
export const AuthProvider = ({ children }) => {
    // State to store user data
    const [userData, setUserData] = useState(null);

    // Router for navigation
    const router = useNavigate();

    // Handle user registration
    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post("/register", {
                name: name,
                username: username,
                password: password,
            });

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };



    // Handle user login
    const handleLogin = async (username, password) => {
        try {
            const request = await client.post("/login", {
                username: username,
                password: password,
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home")
            }
        } catch (err) {
            throw err;
        }
    };
    

    const getHistoryOfUser=async()=>{
        try{
            let request=await client.get("/get_all_activity",{
                params:{
                    token:localStorage.getItem("token")
                }
            });
            return request.data
        }
        catch(err){
            throw err;

        }

    }


    const addToUserHistory = async (meetingcode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingcode
            });
            return request
        } catch (e) {
            throw e;
        }
    }

    // Data shared via context
    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,

        handleLogin,
    };

    // Provide the context to child components
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};