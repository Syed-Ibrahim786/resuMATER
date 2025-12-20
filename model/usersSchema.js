import mongoose from "mongoose";

const usersSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        maxLength:20,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        lowerCase:true,
        trim:true,
        required:true
    },
    password:{
        type:String,
        required:true,
        minLength:6,
        maxLength:200,
        select:false
    },
    refreshToken:{
        type:String,
        select:false
    }
},
{
    timestamps:true
})


const Users = mongoose.model("resumaterusers",usersSchema);
export default Users;