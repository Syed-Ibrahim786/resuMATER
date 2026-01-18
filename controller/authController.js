import Users from "../model/usersSchema.js";
import bcrypt from 'bcrypt'
import createToken from "../utils/createToken.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/verifyToken.js";
import path from "path";

/* ****************************** register ****************************** */

export const registerController = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body;
   

        const hashedPassword = await bcrypt.hash(password, 10);

        //create user in db
        await Users.create({
            name,
            email,
            password:hashedPassword
        })

        res.status(201).json({message:"registered"});
})



/* ****************************** login *********************************** */


export const loginController = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    //get credential
    const existingUser = await Users.findOne({email:email}).select('+password +refreshToken');

    //no user found
    if(!existingUser){
        res.status(401).json({
            message:"wrong email or password"
        });
        return;
    }

    //check password match
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if(!isMatch){
        res.status(401).json({
            message:"wrong email or password"
        });
        return;
    }

     
    const access_token = createToken({
        id:existingUser._id
    }, "100m");
    const refreshToken = createToken({
        id:existingUser._id,
        name:existingUser.name
    }, "1d");

    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite: "none",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
    })


    res.status(200).json({
        message:"success",
        access_token:access_token,
    })   
})

/* ****************************** refresh *********************************** */

export const refreshController = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(401).json({
            message:"refresh token is missing"
        })
    }
    console.log("refresh",refreshToken);
    const payload = verifyToken(refreshToken, process.env.SECRET_KEY);

    const existingUser = await Users.findById(payload.id).select('+refreshToken');

    if(!existingUser || existingUser.refreshToken !== refreshToken){
        return res.status(401).json({
            message:"Unauthorized Access"
        })
    }

    //refresh token rotation
    const newRefreshToken = createToken({
        id:existingUser._id,
        name:existingUser.name}, "1d");
    existingUser.refreshToken = newRefreshToken;
    await existingUser.save();
    res.cookie("refreshToken",newRefreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
       path:"/",
        sameSite:"none",
        maxAge: 24 * 60 * 60 * 1000
    })

    const access_token = createToken({id:existingUser._id}, "100m");

    console.log("new access token  ", access_token)
    res.status(200).json({
        access_token:access_token
    })
})

/* ******************************** logout ****************************** */

export const logoutController = asyncHandler(async (req, res) => {
    if(!req.cookies.refreshToken){
        return res.status(401).json({
            message:"refresh token is missing"
        })
    }
    const payload = verifyToken(req.cookies.refreshToken, process.env.SECRET_KEY); 
    await Users.findByIdAndUpdate(payload.id,{refreshToken:null});
    return res.clearCookie("refreshToken",{
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
        sameSite:"none",
        path:"/"
    }).status(200).json({
        message:"logged out"
    }); 
})








