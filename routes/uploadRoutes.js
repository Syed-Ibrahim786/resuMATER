import express from 'express'
import { uploadController } from "../controller/authController.js";

const uploadRoutes = express.Router();

uploadRoutes.post("/", uploadController);

export default uploadRoutes; 