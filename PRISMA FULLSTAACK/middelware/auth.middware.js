import jwt from "jsonwebtoken";

export let islogin = async (req,res,next) => {
    try {
        let token = req.cookies?.token;  // Retrieve the token from cookies

        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication Failed" });
        }

        let decoded = jwt.verify(token, process.env.JWT_TOKEN); // Verify the token
        req.user = decoded; // Attach decoded user data to req.user

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Authentication failed" });
    }
}