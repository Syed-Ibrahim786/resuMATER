import { GoogleGenAI } from "@google/genai";
import asyncHandler from "../utils/asyncHandler.js";
import { PDFParse } from "pdf-parse";
import fs from 'fs'
import path from "path";
import { cleanAIResponse } from "../utils/cleanAiResponse.js";
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
    - Calculate ATS compatibility score from 0 to 100
    - provide 5 different scores against the given job description.
    - first score denotes skillset score
    - second score denotes project score
    - third score denote keyword match score
    - fourth score denotes experience match score
    - fifth score denotes overall score
    - mention critical issues in resume
    - mention minor issues in resume
    - mention best things in resume
    - provide section explaining why the score.
    - provide own resume content for every resume title under 'best suggestions' by refactoring provided resume by including necessary details against Provided job description and maintaining experience years for getting near 100% ats score or maximum ats score.
    - finally give suggestions to improve the resume against the Job description to gain maximum overall score.
    - Provide clear, actionable feedback to improve the resume for this job

    Scoring criteria for overall score:
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
    {"skillScore":number,"projectScore":number,"keywordMatchScore":number,"experienceScore":number,"overallScore":number,"scoreExplanation":[{"scoreType":"Skills", "explanation":string},{"scoreType":"Projects", "explanation":string},{"scoreType":"keywordMatch", "explanation":string},{"scoreType":"experience", "explanation":string},{"scoreType":"Overall Score", "explanation":string}],"Best Suggestion":{"title":string, "title":string,...},"critical issues":string,"minor issues":string,"best things":string,suggestions":string}
    STRICT OUTPUT RULES:
    - Output MUST be valid JSON
    - Do NOT add new keys
    - Do NOT rename keys
    - Do NOT add explanations outside JSON



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
