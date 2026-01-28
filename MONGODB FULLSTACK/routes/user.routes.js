// routes/user.routes.js
import express from 'express';
import { registeruser, verifyuser, login, logout, getme, forgetpassword, resetpassword } from '../controller/user.controller.js';  
import { isloggedin } from '../middleware/auth.middleware.js';

let router = express.Router();

router.post('/register', registeruser); 
router.get("/verify/:token" , verifyuser);
router.post("/login",login);
router.get("/getme", isloggedin, getme);
router.get("/logout", isloggedin, logout)
router.post("/forgetpassword", forgetpassword)
router.post("/reset/:token",resetpassword)

export default router;
