const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");


const OTPschema =new mongoose.Schema({

    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:60 * 5,

    }
})

// async function sendVerificationMail(email,otp){
//     try {
//         const res= await mailSender(email,'Verification mail from studynotion', otp)
//         console.log("email send successfully",res);
//     } catch (error) {
//         console.log("error in otp model while sending email");
//         throw error;
//     }
// }

// OTPschema.pre('save',async function(next){
//     await sendVerificationMail(this.email,this.otp);
//     next();
// })

async function sendVerificationEmail(email, otp) {
	// Create a transporter to send emails

	// Define the email options

	// Send the email
	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp)
		);
		console.log("Email sent successfully: ", mailResponse.response);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}
}

// Define a post-save hook to send email after the document has been saved
OTPschema.pre("save", async function (next) {
	console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
	next();
});



module.exports = mongoose.model("OTP",OTPschema); 