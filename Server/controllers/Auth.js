const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile")

const otpGenerator = require("otp-generator")

const bcrypt = require("bcrypt")
const {passwordUpdated}= require("../mail/templates/passwordUpdate")

const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");

require("dotenv").config();
// Send otp

// exports.sendotp = async (req,res)=>{

//     try {
        
//      const {email} = req.body;

// 		const checkUserPresent = await User.findOne({ email });


//     if(checkUserPresent){
//         return res.status(401).json({
//             success:false,
//             message:"user already exist or registered"


//         })
//     }


//         var otp = otpGenerator.generate(6,{
//             upperCaseAlphabets:false,
//             lowerCaseAlphabets:false,
//             specialChars:false
//         })

//         console.log("otp generated",otp);

//         let result = await OTP.findOne({otp: otp});

//         while(result){
//             otp=otpGenerator.generate(6,{
//                 upperCaseAlphabets:false,
//                 lowerCaseAlphabets:false,
//                 specialChars:false
//             })

//             result = await OTP.findOne({otp:otp});

//         }


//         const otpPayload = {email, otp};

//         const otpBody  = await OTP.create(otpPayload);

//         console.log(otpBody);
//         res.status(200).json({
//             success:true,
//             message:"otp sent successfully",
//             otp
//         })


//     } catch (error) {
        
//         console.log(error)
//         res.status(500).json({
//             success:false,
//             message:error.message
//         })
//     }

// }
exports.sendotp = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if user is already present
		// Find user with provided email
		const checkUserPresent = await User.findOne({ email });
		// to be used in case of signup

		// If user found with provided email
		if (checkUserPresent) {
			// Return 401 Unauthorized status code with error message
			return res.status(401).json({
				success: false,
				message: `User is Already Registered`,
			});
		}

		var otp = otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
		});
		const result = await OTP.findOne({ otp: otp });
		console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);
		while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
			});
		}
		const otpPayload = { email, otp };
		const otpBody = await OTP.create(otpPayload);
		console.log("OTP Body", otpBody);
		res.status(200).json({
			success: true,
			message: `OTP Sent Successfully`,
			otp,
		});
	} catch (error) {
		console.log(error.message);
		return res.status(500).json({ success: false, error: error.message });
	}
};


exports.signup = async (req,res)=>{
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } =req.body;

        if(!firstName || !lastName || !email ||!password || !confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message:"all fields are mandatory to fill"
            })
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"password and confirmpassword does not match"
            })
        }

        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User already exist please login to continue"
            })
        }

        // find more recent otp

        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);

        if(recentOtp.length ===0){
            return res.status(400).json({
                success:false,
                message:"otp not found in db"
            })
        
        } else if(otp !== recentOtp[0].otp){
            return res.status(400).json({
                success:false,
                message:"invalid otp"
            })
        }

        let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

        const hashedPassword = await bcrypt.hash(password,10);

        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null
        })

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            approved:approved,
            additionalDetails:profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })

        return res.status(200).json({
            success:true,
            message:"user is resgisterd succcessfully",
            user
        })

    } catch (error) {
        console.log(error)
        
        return res.status(500).json({
            success:false,
            message:"user cannot be registered Please try again "
        })
    }
}

exports.login = async (req, res)=>{
    try {
        
        const {email,password}= req.body;

        if(!email||!password){
            return res.status(403).json({
                success:false,
                message:"pleaase enter all the details"
            })
        }

        const user = await User.findOne({email}).populate("additionalDetails");

        if(!user){
            return res.status(401).json({
                 success:false,
                 message:"user not found please register to login "
            })
        }

        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                accountType:user.accountType,
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET,{
                expiresIn:"2h"
            })

            user.token = token;
            user.password =undefined
            console.log(user)
            
            const options ={
                expires:new Date(Date.now() + 3*24+60*60*100),
                httpOnly:true
            }

            res.cookie("token",token, options).status(200).json({
                success:true,
                token,
                user,
                message:"logged in successfully"
            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:"password is incorrect"
            })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"login failed"
        })
    }
    
}

exports.changePassword = async(req,res) =>{
        try {
            const userId = req.user.id;
            const userDetails=await User.findById(userId);
            const {oldPassword,newPassword,confirmNewPassword}=req.body;
            if(!userDetails){
                res.status(400).json({
                    success:false,
                    message:"user details not found"
                })
            }
            if(!oldPassword||!newPassword||!confirmNewPassword){
                res.status(400).json({
                    success:false,
                    message:"please fill all the details"
                })
            }

            const isPasswordMatch = await bcrypt.compare(
                oldPassword,
                userDetails.password
            );

            if(!isPasswordMatch){
                res.status(400).json({
                    success:false,
                    message:"please enter correct password"
                })
            }

            if(newPassword!==confirmNewPassword){
                return res.status(400).json({
                    success: false,
                    message: "The password and confirm password does not match",
                });
            }

            const encryptedPassword = await bcrypt.hash(newPassword,10);
            const updatedUserDetails = await User.findByIdAndUpdate(
                userId,
                {password:encryptedPassword},
                {new:true}
            )

            try {
                const emailResponse = await mailSender(
                    updatedUserDetails.email,
                    passwordUpdated(
                        updatedUserDetails.email,
                        `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                    )
                )
                console.log("Email sent successfully:", emailResponse.response);
            } catch (error) {
                console.error("Error occurred while sending email:", error);
                return res.status(500).json({
                    success: false,
                    message: "Error occurred while sending email",
                    error: error.message,
                });
            }
            return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });

        } catch (error) {
            console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
        }
}