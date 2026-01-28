import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import nodemailer from "nodemailer"
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const registerUser = async (req,res) => {
    const {email,password,name,phone,username} = req.body
    if(!name || !email || !password || !phone || !username){
        return res.status(400).json({message: "ALL Field Requied",success:false})
    }
    try {
      const existinguser = await prisma.user.findUnique({
            where: {email}
        })

        if(existinguser){
            return res.status(400).json({message: "User already exist",success:false})
        }

       const hashedPassword = await bcrypt.hash(password,10)
       let verificationtoken = crypto.randomBytes(32).toString("hex");

       const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          verificationtoken,
          username
        },
      });

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
        ${process.env.URL}/api/v1/users/verify/${verificationtoken}`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "User registered successfully", success: true });

        
    } catch (error) {
        console.log(error)
     return res.status(500).json({ message: "User registered failed", success: false });
        
    }
}

const verifyuser = async (req,res) => {
  let {verificationtoken} = req.params;

  if (!verificationtoken) {
    return res.status(400).json({ message: "Invalid token" });
  }

  try {
    const updatedUser = await prisma.user.update({
        where: {
            verificationtoken: verificationtoken,  // Find the user by the verification token
        },
        data: {
          isverified: true,              // Update the `isVerified` field to `true`
          verificationtoken: null,       // Set the `verificationToken` to `null`
        },
      });
    if(!updatedUser){
        return res.status(400).json({ message: "Invalid token" });
    }  
    res.status(200).json({ message: "User verified successfully", success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Verification failed", success: false });
  }
}

const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      // Find user by email
      let user = await prisma.user.findUnique({
        where: {
          email: email
        }
      });
  
      // Check if user exists
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
  
      // Compare passwords
      let isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
  
      // Check if user is verified
      if (!user.isverified) {
        return res.status(400).json({ message: "Please verify your email." });
      }
  
      // Create JWT token
      let jwttoken = jwt.sign(
        { id: user.id },
        process.env.JWT_TOKEN,
        { expiresIn: "24h" }
      );
  
      // Cookie options
      const cookieOptions = {
        httpOnly: true,
        secure: true,  // Make sure your app is using HTTPS
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
      };
  
      // Set the token as an HTTP-only cookie
      res.cookie("token", jwttoken, cookieOptions);
  
      // Send success response
      res.status(200).json({
        success: true,
        message: "Login successful",
        token: jwttoken,
        user: {
          id: user.id,
          name: user.name,
        },
      });
    } catch (error) {
      // Catch any errors and return an internal server error
      console.error("Error during login:", error);
      res.status(500).json({
        success: false,
        message: "Something went wrong, please try again later.",
      });
    }
};

const getme = async (req,res) => {
    try {
        let user = await prisma.user.findUnique({
            where: {
              id: req.user.id
            }
          });
        
       if(!user){
        return res.status(400).json({success: false, message: "user not found"})
       }

       res.status(200).json({success:true,user})
        
    } catch (error) {
        
    }

};



export {registerUser , verifyuser, login,getme}