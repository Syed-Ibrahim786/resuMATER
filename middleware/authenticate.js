import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/verifyToken.js";

export const authenticate = asyncHandler((req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log(req.headers);

    if(!token){
        return res.status(401).json({
            message:"Unauthorized access"
        });
    }

    const payload = verifyToken(token, process.env.SECRET_KEY);

    req.body.user = payload;
    next(); 
})