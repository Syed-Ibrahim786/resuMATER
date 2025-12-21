import express from 'express'
import { uploadController } from '../controller/uploadController.js';

const uploadRoutes = express.Router();

uploadRoutes.post("/", uploadController);

export default uploadRoutes; 