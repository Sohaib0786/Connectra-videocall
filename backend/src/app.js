import  express  from "express";
import {createServer} from "node:http";

import { Server } from "socket.io";
//import mongoose from "mongoose";
import {connectToSocket} from "./controllers/socketManager.js";
import connectDB from './db.js'; // path to your db.js
import cors from "cors";
import userRoutes from "./routes/users.route.js";


const app=express();
const server=createServer(app);
const io=connectToSocket(server);



app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));

app.use("/api/v1/users",userRoutes);

connectDB(); // Connect to MongoDB


app.get("/home",(req,res)=>{
    res.send("you are at home");
});

//const conn=mongoose.connect("mongodb+srv://shoaibqu7714:K4TPZ7GCaSBYKdMB@cluster0.hygcli5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
   

app.listen(8080,(req,res)=>{
    console.log("app is listening at port no.8080");
})

