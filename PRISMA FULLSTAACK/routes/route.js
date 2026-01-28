import express from "express"
import {registerUser,verifyuser,login,getme} from "../controllers/auth.controller.js"
import {islogin} from '../middelware/auth.middware.js';

const userRoute = express.Router();

userRoute.post("/register",registerUser)
userRoute.post("/verify/:verificationtoken",verifyuser)
userRoute.post("/login",login)
userRoute.get("/getme",islogin,getme)


export default userRoute;