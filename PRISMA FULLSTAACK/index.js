import express from "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import cors from "cors"
import userRoute from "./routes/route.js";

dotenv.config();
const port = process.env.PORT || 4000
const app = express();

app.use(cookieParser());
app.use(cors({
    origin: process.env.URL
}))
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/",(req, res) => {
    res.status(200).json({
        success: true,
        message: "Working checked"
    })
})

app.use("/api/v1/users",userRoute);


app.listen(port,() => {
    console.log(`Backend is listen at: ${port}`)
})