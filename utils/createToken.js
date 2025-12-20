import jwt from 'jsonwebtoken'
export default function createToken(payload, expiresIn){

    const token = jwt.sign(payload,process.env.SECRET_KEY, {expiresIn});
    return token; 

}