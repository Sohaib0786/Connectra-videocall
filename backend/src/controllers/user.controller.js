import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import  {meeting}  from "../models/meeting.model.js";
import jwt from "jsonwebtoken";


const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Please provide username and password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
            const token = jwt.sign({ id: user._id, username: user.username }, "your_secret_key", { expiresIn: "1h" });
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ success: true, token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Invalid username or password" });
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: e.message });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ success: false, message: "User already exists" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, password: hashPassword });
        await newUser.save();
        return res.status(httpStatus.CREATED).json({ success: true, message: "User registered successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: e.message });
    }
};


const getUserHistory = async (req, res) => {

    const { token } = req.query; // Access token from query params
    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const history = await meeting.find({ user_id: user.username });
        res.status(200).json(history);  // Return the user's meeting history
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(400).json({ success: false, message: "Token and meeting code are required" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const existingMeeting = await meeting.findOne({ user_id: user.username, meetingcode: meeting_code });
        if (existingMeeting) {
            return res.status(400).json({ success: false, message: "Meeting already exists in history" });
        }

        const newMeeting = new meeting({ user_id: user.username, meetingcode: meeting_code });
        await newMeeting.save();
        res.status(httpStatus.CREATED).json({ success: true, message: "Meeting added to history" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
};

export { register, login, getUserHistory, addToHistory };