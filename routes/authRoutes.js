import express from 'express'
import  { isEmailValid, isNameValid, isPasswordValid } from '../middleware/verify.js';
import validator from '../middleware/validator.js';
import {loginController,  logoutController,  refreshController,  registerController } from '../controller/authController.js';
const authRoutes = express.Router();

authRoutes.post("/login",isEmailValid, validator, loginController);

authRoutes.post("/register", isNameValid, isPasswordValid, validator, registerController);

authRoutes.post("/refresh",refreshController);

authRoutes.post("/logout", logoutController);


export default authRoutes;
