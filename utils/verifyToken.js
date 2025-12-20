import jwt from 'jsonwebtoken'

export const verifyToken = (token, key) => {
    return jwt.verify(token, key);
}