import { validationResult } from "express-validator";

export default function validator(req, res, next){
    const error = validationResult(req);
  
    if(!error.isEmpty()){
       res.status(400).json({
        errors:error.array().map((each) => each.msg)
       })
       return;
    }
    next();
}