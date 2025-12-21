import Users from "../model/usersSchema.js";
import bcrypt from 'bcrypt'
import createToken from "../utils/createToken.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/verifyToken.js";
import { GoogleGenAI } from "@google/genai";
import fs from 'fs'
import path from "path";

import { PDFParse } from 'pdf-parse';
import { cleanAIResponse } from "../utils/cleanAiResponse.js";
import { response } from "express";

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
    if(existingUser === null){
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
    }, "1m");
    const refreshToken = createToken({
        id:existingUser._id,
        name:existingUser.name
    }, "3m");

    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
       
        sameSite:"strict",
        maxAge: 3 * 60 * 1000
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
        return res.status(400).json({
            message:"refresh token is missing"
        })
    }
    console.log(refreshToken);
    const payload = verifyToken(refreshToken, process.env.SECRET_KEY);

    const existingUser = await Users.findById(payload.id).select('+refreshToken').lean();

    if(!existingUser || existingUser.refreshToken !== refreshToken){
        return res.status(401).json({
            message:"token expired"
        })
    }

    const access_token = createToken({id:existingUser._id}, "3m");

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
        sameSite:"strict"
    }).status(200).json({
        message:"logged out"
    }); 
})

/* ******************************** uploads ****************************** */

export const uploadController = asyncHandler(async (req, res) => { 

    
    const ai = new GoogleGenAI({});

    //parse text  from pdf
    const data = new Uint8Array(fs.readFileSync(path.resolve(req.file.path)));
    const parser = new PDFParse({ data, partial: true, first: 1 }); 
    const textRes = await parser.getText();
    console.log(`Text from the first ${textRes.pages.length} pages:`, textRes.text);
    await parser.destroy(); // Clean up resources
 

    //prompt ai
    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are an ATS (Applicant Tracking System) evaluator.

    Below is:
    1. A candidate's resume
    2. A job description
    
    Your task:
    - Compare the resume against the job description
    - Calculate an ATS compatibility score from 0 to 100
    - Provide clear, actionable feedback to improve the resume for this job

    Scoring criteria:
    - Skill match
    - Keyword overlap
    - Relevant experience
    - Tools & technologies
    - Role alignment

    Rules:
    - If the job description is insufficient or too short, clearly mention it in feedback
    - Do NOT hallucinate missing job requirements
    - Be honest and strict like a real ATS

    Generate the result as a raw JSON object. Do not include any text before 
    or after the JSON, and do not use \`\`\`json markdown or escape characters. The output must
    start immediately with the opening curly brace like below one:
    {"score":number,"feedback":string}



    Resume:
    """
    ${textRes.text}
    """

    Job Description:
    """
    ${req.body.JD}
    """`});
    console.log(response.text);


    //clean ai response
    const cleaned = cleanAIResponse(response.text)
    console.log(cleaned)

    const cleanedjson = JSON.parse(cleaned);

    console.log(cleanedjson);

    fs.unlinkSync(req.file.path);

    res.status(200).json(cleanedjson); 
})







