const jwt = require("jsonwebtoken")
require("dotenv").config();
const User = require("../models/User")
 
exports.auth = async (req,res,next)=>{
    try {
        
        // console.log("token in auth",req.header)
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");
        if(!token){
            return res.status(400).json({
                success:false,
                message:"Token is missing "
            })
        }

        try {
            const decode = await jwt.verify(token,process.env.JWT_SECRET);
            console.log(decode)
            req.user= decode
        } catch (error) {
            return res.status(401).json({
                success:false,
                message:"token is invalid"
            })     
        }

        next();

    } catch (error) {
        console.log(error);
        return res.status(402).json({
            success:false,
            message:"error while verifying token in auth"
        })
    }
}



exports.isStudent = async (req,res,next)=>{
    try {
        
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for student only"
            })
        }
        next();

    } catch (error) {
        console.log(error);
        return res.status(402).json({
            success:false,
            message:"error while verifying token in Isstudent"
        })
    }
}
exports.isInstructor = async (req,res,next)=>{
    try {
        
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for Instructor only"
            })
        }
        next();

    } catch (error) {
        console.log(error);
        return res.status(402).json({
            success:false,
            message:"error while verifying token in isInstructor"
        })
    }
}

exports.isAdmin = async (req,res,next)=>{
    try {
        
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"this is a protected route for Admin only"
            })
        }
        next();

    } catch (error) {
        console.log(error);
        return res.status(402).json({
            success:false,
            message:"error while verifying token in Isadmin"
        })
    }
}