// controller/user.controller.js
import User from '../model/user.model.js';
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register User
const registeruser = async (req, res) => {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        let user = await User.create({ name, password, email });

        if (!user) {
            return res.status(400).json({ message: "User not registered" });
        }

        let token = crypto.randomBytes(32).toString("hex");
        user.verificationToken = token;
        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false,
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });

        let mailOptions = {
            from: '"Magic Elves" <from@example.com>',
            to: '"Mailtrap Inbox" <to@example.com>', // Send email to the user's email
            subject: "Verify Your Email",
            text: `Please click on the following link to verify your account:
            ${process.env.BASE_URL}/api/v1/users/verify/${token}`
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "User registered successfully", success: true });

    } catch (error) {
        return res.status(400).json({ message: "User not registered", success: false , error: error.message});
    }
};

// Verify User
const verifyuser = async (req, res) => {
    let { token } = req.params;

    if (!token) {
        return res.status(400).json({ message: "Invalid token" });
    }

    try {
        let user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: "Invalid token" });
        }

        user.isverified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: "User verified successfully", success: true });
    } catch (error) {
        return res.status(400).json({ message: "Verification failed", success: false });
    }
};

// Login User
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        let isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.isverified) {
            return res.status(400).json({ message: "Please verify your email." });
        }

        let token = jwt.sign(
            { id: user._id },
            process.env.JWT_TOKEN,
            { expiresIn: "24h" }
        );

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        };

        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
            },
        });

    } catch (error) {
        return res.status(500).json({ message: "Login failed", success: false });
    }
};

const getme = async (req,res) => {
    try {
       let user = await User.findById(req.user.id).select('-password')
        
       if(!user){
        return res.status(400).json({success: false, message: "user not found"})
       }

       res.status(200).json({success:true,user})
        
    } catch (error) {
        
    }

};

const logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0) // Expire immediately
        });

        // Send success response
        res.status(200).json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const forgetpassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 mins

        // Save user with token
        await user.save();

        // Setup nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false,
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });

        // Email content
        let mailOptions = {
            from: '"Magic Elves" <from@example.com>',
            to: '"Mailtrap Inbox" <to@example.com>', // Send to actual user email
            subject: "Password Reset Request",
            text: `Hello, 
            
            You requested a password reset. Please click the link below to reset your password:
            ${process.env.BASE_URL}/api/v1/users/reset/${token}`
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Password reset email sent" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error, try again later" });
    }
};

const resetpassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        let user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Check if token is still valid
        });
        console.log(token)

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

         user.password = await newPassword

        // Clear reset token fields after successful password update
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful" });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ success: false, message: "Server error, try again later" });
    }
};

export { registeruser, verifyuser, login, logout, getme, forgetpassword, resetpassword };
