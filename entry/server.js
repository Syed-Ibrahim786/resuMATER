import express from 'express'
import dotenv from 'dotenv'
import connectDB from '../db/mongodbSetup.js'
import authRoutes from '../routes/authRoutes.js'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
dotenv.config()
const port = process.env.PORT || 8001



 
const app = express()

const limiter = rateLimit({
    windowMs:1 * 60 * 1000,
    max:60,
    message:{
        success:false,
        message:"too many requests are made, try after some time"
    }
})

/* *************************    global middleware   *****************************/
app.use(limiter);
app.use(express.json({limit:"10kb"}));
app.use(cookieParser());





/* ***************************    routes    **************************************/

app.get("/health",(req,res) =>{
res.status(200).json({ status: "OK" });});

app.use("/auth",authRoutes);


/* ***************************    404 handler    **************************************/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ***************************    central error handler    **************************************/


app.use((err, req, res, next) => {
    console.error(err.stack);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    // JWT errors
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    // Mongo duplicate key
    if (err.code === 11000) {
        statusCode = 409;
        message = "Resource already exists";
    }

    res.status(statusCode).json({ error: message });
})



/* ***************************    server bootstrap    **************************************/

connectDB()
.then(() => app.listen(port,() => {
    console.log(`server running at port ${port}`)
}))
.catch((err) => {
    console.error("❌ Failed to start server:", err.message);

    process.exit(1);
})
