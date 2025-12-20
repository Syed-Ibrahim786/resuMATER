import mongoose from 'mongoose'

 export default async  function connect(){

    try {
        await mongoose.connect(process.env.MONGODB_URL,{
      serverSelectionTimeoutMS: 5000, // fail fast
    });
        console.log("mongoDB connected!");
    } catch (error) {
        console.log("db not connected???", error.message);
        throw Error;
    }
}
