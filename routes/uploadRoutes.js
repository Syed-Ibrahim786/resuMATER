import express from 'express'
import { uploadController } from '../controller/uploadController.js';
import { authenticate } from '../middleware/authenticate.js';

const uploadRoutes = express.Router();

uploadRoutes.post("/", authenticate, uploadController);

export default uploadRoutes; 