const User= require("../models/User")
const Course = require("../models/Course");
const {instance}  = require("../config/razorpay")
const mailSender  = require("../utils/mailSender");
const { default: mongoose } = require("mongoose");
const {paymentSuccessEmail} = require("../mail/templates/paymentSuccessEmail")
const crypto = require("crypto");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail")
const CourseProgress = require("../models/CourseProgress")

// capture the payment and initiate the razorpay order


exports.capturePayment = async (req,res)=>{
    const {courses} = req.body;
    const userId = req.user.id;
    if(courses.length ===0){
        return res.status(4001).json({
            success:false,
            message:"Please provide course ID"
        })

    }


    let totalAmount =0;
     for(const course_id of courses){
        let course ;
        try{
            course = await Course.findById(course_id);
            if(!course){
                return res.status(400).json({
                    success:false,
                    message:"could not find the course"
                })
            }

            const uid=new mongoose.Types.ObjectId(userId)
            if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false,
                    message:"user already enrolled to the course"
                })            
            }
            totalAmount+= course.price;
        }
        catch(error){
            console.log(error);

            return res.status(500).json({success:false, message:error.message});

        }
     }

     const currency ="INR";
     const options ={
        amount:totalAmount * 100,
        currency,
        receipt:Math.random(Date.now()).toString(),
     }


     try {
        const paymentResponse = await instance.orders.create(options);
        res.json({
            success:true,
            message:paymentResponse
        })
     } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, mesage:"Could not Initiate Order"});
     }
}



// verify paymentResponse
exports.verifyPayment = async (req,res)=>{

    const razorpay_order_id = req.body?.razorpay_order_id
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    
    const courses = req.body?.courses;
    const userId = req.user.id;
    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
            return res.status(401).json({success:false, message:"Payment Failed"});
    }
    
    let body = razorpay_order_id + "|" + razorpay_payment_id;
    
    
                const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_SECRET)
                .update(body.toString())
                .digest("hex");
    
    
    if(expectedSignature === razorpay_signature){
        await enrollStudents(courses,userId, res);
    
        return res.status(200).json({
            success:true,
            message:"payment verified"
        })
    }
    
    return res.status(401).json({
        success:false,
        message:"payment failed"
    })
}


// enrollStudents

const enrollStudents = async(courses, userId, res)=>{
    if(!courses || !userId) {
        return res.status(400).json({success:false,message:"Please Provide data for Courses or UserId"});
    }

    for(const courseId of courses){
        try {
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id:courseId},
                {$push:{studentsEnrolled:userId}},
                {new:true}
            )
            if(!enrolledCourse) {
                return res.status(500).json({success:false,message:"Course not Found"});
            }

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
              })

            const enrolledStudent = await User.findByIdAndUpdate(userId,
                {$push:{
                    courses: courseId,
                    courseProgress: courseProgress._id,

                }},{new:true})
    
                const emailResponse = await mailSender(
                    enrolledStudent.email,
                    `Successfully Enrolled into ${enrolledCourse.courseName}`,
                    courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
                ) 

        } catch (error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }
}


exports.sendPaymentSuccessEmail = async(req, res) => {
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({success:false, message:"Please provide all the fields"});
    }

    try{
        //student ko dhundo
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
             paymentSuccessEmail(`${enrolledStudent.firstName}`,
             amount/100,orderId, paymentId)
        )
    }
    catch(error) {
        console.log("error in sending mail", error)
        return res.status(500).json({success:false, message:"Could not send email"})
    }
}

// exports.capturePayment = async (req,res)=>{
//     // get courseId and userId
//     const {courseId}=req.body;
//     const userId=req.user.id;

//     if(!courseId){
//         return res.status(400).json({
//             success:false,
//             message:"please provide course details"
//         })
//     }

//     // check user has enrolled or <noscript>
//     let course;
//     try {
        
//         course= await Course.findById(courseId);
//         if(!course){
//             return res.status(400).json({
//                 success:false,
//                 message:"course details not found"
//             })
//         }


//         // convert the user id from payload into object type

//         const uid= new mongoose.Types.ObjectId(userId);

//         if(course.studentsEnrolled.includes(uid)){
//             return res.status(400).json({
//                 success:false,
//                 message:"student is already enrolled"
//             })
//         }


//     } catch (error) {
//          console.error(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         });
//     }



//     const amount = course.price;
//     const currency = "INR";
//     const options = {
//         amount:amount * 100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes:{
//             courseId:courseId,
//             userId
//         }
//     };

//     try {
//         const paymentResponse = await instance.orders.create(options);
//         console.log(paymentResponse);
//         return res.status(200).json({
//             success:true,
//             courseName:course.courseName,
//             courseDescription:course.courseDescription,
//             thumbnail: course.thumbnail,
//             orderId: paymentResponse.id,
//             currency:paymentResponse.currency,
//             amount:paymentResponse.amount,
//         })
//     } catch (error) {
//         console.log(error);
//         res.json({
//             success:false,
//             message:"Could not initiate order",
//         });
        
//     }
// }

// exports.verifySignature = async(req,res)=>{
//     const webhookSecret = "12345678";

//     const signature = req.headers["x-razorpay-signature"];
//     const shasum = crypto.createHmac("sha256",webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest= shasum.digest("hex");

//     if(signature===digest){
//         console.log("payment authorized ")
//         const {courseId,userId} = req.body.payload.payment.entity.notes;

//         try {
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 {_id: courseId},
//                 {$push:{studentsEnrolled: userId}},
//                 {new:true},
//                 );

//                 if(!enrolledCourse) {
//                 return res.status(500).json({
//                 success:false,
//                 message:'Course not Found',
//                 });
//                 }

//                 console.log(enrolledCourse);

//                 //find the student andadd the course to their list enrolled courses me 
//                 const enrolledStudent = await User.findOneAndUpdate(
//                                 {_id:userId},
//                                 {$push:{courses:courseId}},
//                                 {new:true},
//                 );

//                 console.log(enrolledStudent);

//                 //mail send krdo confirmation wala 
//                 const emailResponse = await mailSender(
//                         enrolledStudent.email,
//                         "Congratulations from CodeHelp",
//                         "Congratulations, you are onboarded into new CodeHelp Course",
//                 );

//                 console.log(emailResponse);
//                 return res.status(200).json({
//                 success:true,
//                 message:"Signature Verified and COurse Added",
//                 });


            
//         } catch (error) {
//             console.log(error);
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             });   
//         }
//     }

//     else {
//         return res.status(400).json({
//             success:false,
//             message:'Invalid request',
//         });
//     }
// }