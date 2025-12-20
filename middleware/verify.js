import {body} from 'express-validator'

export const isEmailValid = [
    body("email")
    .notEmpty().withMessage("empty email is given")
    .isEmail().withMessage("invalid email or password"),

   
]

export const isPasswordValid = [
    body("password")
    .notEmpty().withMessage("password is empty")
    .isLength({min:6, max:20}).withMessage("paswword given is either long or small")
]

export const isNameValid = [
    body("name")
    .notEmpty().withMessage("name is empty")
    .isLength({max:20}).withMessage("name is too long")
]



