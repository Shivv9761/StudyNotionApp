const User= require("../models/User")
const mailSender = require("../utils/mailSender")
const crypto= require("crypto")

const bcrypt = require("bcrypt")
exports.resetPasswordToken = async (req,res)=>{
    try {
        
        const email = req.body.email;
        const user = await User.findOne({email:email})

        if(!user){
            return res.json({
                success:false,
                message:"your email is not registered with us"

            })
        }

        const token = crypto.randomUUID();

        const updatedDetails = await User.findOneAndUpdate({email:email},{
            token:token,
            resetPasswordExpires:Date.now() + 5*60*1000
        },{new:true});
        console.log("details",updatedDetails)

        const url  = `http://localhost:3000/update-password/${token}`

        await mailSender(email,"Password reset link",`password reset link ${url}`)

        return res.json({
            success:true,
            message:"email sent successfully for password change"
        })

    } catch (error) {
        console.log(error);
        return res.status(402).json({
            success:false,
            message:"error while creating resetn pasawoord token"
        })
    }
}


exports.resetPassword = async (req,res)=>{
    try {
        const{password,confirmPassword,token}=req.body;

        if(password!=confirmPassword){
            return res.json({
                success:false,
                message:"password not matching "
            })
        }

        const userDetails  = await User.findOne({token:token});

        if(!userDetails){
            return res.json({
                success:false,
                message:"token is invalid"
            })
        }

        if(userDetails.resetPasswordExpires< Date.now()  ){
            return res.json({
                success:false,
                message:"token is expired regenerate token"
            })
        }
        
        const hashedPassword = await bcrypt.hash(password,10);

        await User.findOneAndUpdate({token:token},{password:hashedPassword},{new:true});

        return res.status(200).json({
            success:true,
            message:"password changed successfully"
        })

    } catch (error) {
        console.log(error);
        return res.status(402).json({
            success:false,
            message:"error while reseting password "
        })
    }
}