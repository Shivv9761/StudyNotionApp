const Course = require("../models/Course")
// const Tag = require("../models/tags")
const User = require("../models/User")
const Category = require("../models/Category");
const cloudinary= require('cloudinary').v2;
const {uploadImageToCloudinary} =require("../utils/imageUploader");

// const Course = require("../models/Course")
// const Category = require("../models/Category")
const Section = require("../models/Section")
// const SubSection = require("../models/SubSection")
const SubSection =require('../models/Subsection')
// const User = require("../models/User")
// const { uploadImageToCloudinary } = require("../utils/imageUploader")
const CourseProgress = require("../models/CourseProgress")
const { convertSecondsToDuration } = require("../utils/secToDuration")
// exports.createCourse = async (req,res)=>{
//     try {
        
//         const {courseName, courseDescription, whatYouWillLearn, price, tag}= req.body;

//         const thumbnail = req.files.thumbnailImage;

//         // validation

//         if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag){
//             return res.status(400).json({
//                 success:false,
//                 message:"please fill all the fields",

//             })

//         }

//         const userId = req.user.id;
//         const instructorDetails= await User.findById(userId);
//         console.log("Instructor Details", instructorDetails);

//         if(!instructorDetails){
//             res.status(400).json({
//                 success:false,
//                 message:"instructor details not found"
//             })
//         }
        

//         const categoryDetails = await Category.findById(tag);
//         if(!categoryDetails){
//             res.status(400).json({
//                 success:false,
//                 message:"Tag details not able to find"
//             })
//         }

//         const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME)

//         const newCourse = await Course.create({
//             courseName,
//             courseDescription,
//             instructor:instructorDetails._id,
//             whatYouWillLearn:whatYouWillLearn,
//             price,
//             tag:tagDetails._id,
//             thumbnail:thumbnailImage.secure_url,
//         })

//         await User.findByIdAndUpdate(
//             {_id:instructorDetails._id},
//             {
//                 $push:{
//                     courses:newCourse._id
//                 }
//             },
//             {new:true}
//         );

//         await Tag.findByIdAndUpdate(
//             {id:tagDetails._id},
//             {
//                 $push:{
//                     course: newCourse.id
//                 },
//             },
//             {new:true}
//             )
        

//             return res.status(200).json({
//                 success:true,
//                 message:"course created successfully",
//                 data:newCourse
//             });
//     } catch (error) {

//         console.log(error)

//         return res.status(500).json({
//             success:false,
//             message:"failed to create course"
//         })
        
//     }
// }

exports.createCourse = async (req, res) => {
	try {
		// Get user ID from request object
		const userId = req.user.id;

		// Get all required fields from request body
		let {
			courseName,
			courseDescription,
			whatYouWillLearn,
			price,
			tag,
			category,
			status,
			instructions,
		} = req.body;

		// Get thumbnail image from request files
		const thumbnail = req.files.thumbnailImage;

		// Check if any of the required fields are missing
		if (
			!courseName ||
			!courseDescription ||
			!whatYouWillLearn ||
			!price ||
			!tag ||
			!thumbnail ||
			!category
		) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Mandatory",
			});
		}
		if (!status || status === undefined) {
			status = "Draft";
		}
		// Check if the user is an instructor
		const instructorDetails = await User.findById(userId, {
			accountType: "Instructor",
		});

		if (!instructorDetails) {
			return res.status(404).json({
				success: false,
				message: "Instructor Details Not Found",
			});
		}

		// Check if the tag given is valid
		const categoryDetails = await Category.findById(category);
		if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			});
		}
		// Upload the Thumbnail to Cloudinary
		const thumbnailImage = await uploadImageToCloudinary(
			thumbnail,
			process.env.FOLDER_NAME
		);
		console.log(thumbnailImage);
		// Create a new course with the given details
		const newCourse = await Course.create({
			courseName,
			courseDescription,
			instructor: instructorDetails._id,
			whatYouWillLearn: whatYouWillLearn,
			price,
			tag: tag,
			category: categoryDetails._id,
			thumbnail: thumbnailImage.secure_url,
			status: status,
			instructions: instructions,
		});

		// Add the new course to the User Schema of the Instructor
		await User.findByIdAndUpdate(
			{
				_id: instructorDetails._id,
			},
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);
		// Add the new course to the Categories
		await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);
		// Return the new course and a success message
		res.status(200).json({
			success: true,
			data: newCourse,
			message: "Course Created Successfully",
		});
	} catch (error) {
		// Handle any errors that occur during the creation of the course
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to create course",
			error: error.message,
		});
	}
};

// Edit Course Details
exports.editCourse = async (req, res) => {
	try {
	  const { courseId } = req.body
	  const updates = req.body
	  const course = await Course.findById(courseId)
	  console.log("in server req body of course",req.body)
	  if (!course) {
		  return res.status(404).json({ error: "Course not found" })
		}
	// if(category){

	// 		const newCategory=await Category.findByIdAndUpdate({_id:category},{$push:{courses:courseId}},{new:true})
	// }
	// 	// console.log("prev category",prevCategory);
	// if(prevCategory){

	// 		const prevCategory=await Category.findByIdAndUpdate({_id:prevCategory},{$pull:{courses:courseId}},{new:true})
	// }
	  // If Thumbnail Image is found, update it
	  if (req.files) {
		console.log("thumbnail update")
		const thumbnail = req.files.thumbnailImage
		const thumbnailImage = await uploadImageToCloudinary(
		  thumbnail,
		  process.env.FOLDER_NAME
		)
		course.thumbnail = thumbnailImage.secure_url
	  }
  
	  // Update only the fields that are present in the request body
	  for (const key in updates) {
		if (updates.hasOwnProperty(key)) {
		  if (key === "tag" || key === "instructions") {
			// console.log("in key loop if inside JSON>PARSEupdated[key]",JSON.parse(updates[key]))
			// console.log("in key loop if CCOURSE[key]",course[key])
			course[key] = JSON.parse(updates[key])
		  } else {
			// console.log("in key loop else inside",key)
			// console.log("in key loop else inside JSON>PARSEupdated[key]",updates[key])
			// console.log("in key loop else CCOURSE[key]",course[key])
			course[key] = updates[key]
		  }
		}
	  }
  
	  await course.save()
  
	  const updatedCourse = await Course.findOne({
		_id: courseId,
	  })
		.populate({
		  path: "instructor",
		  populate: {
			path: "additionalDetails",
		  },
		})
		.populate("category")
		.populate("ratingAndReviews")
		.populate({
		  path: "courseContent",
		  populate: {
			path: "subSection",
		  },
		})
		.exec()
  
	  res.json({
		success: true,
		message: "Course updated successfully",
		data: updatedCourse,
	  })
	} catch (error) {
	  console.error(error)
	  res.status(500).json({
		success: false,
		message: "Internal server error",
		error: error.message,
	  })
	}
  }

exports.getAllCourses = async (req,res) =>{
    try {
        const allCourses = await Course.find({},{courseName:true,
                                                  price:true,
                                                thumbnail:true,
                                            instructor:true,
                                        ratingAndReviews:true,
                                         studentsEnrolled:true })
                                         .populate("instructor")
                                         .exec();


        return res.status(200).json({
            success:true,
            message:"Data for all courses fetched successfully",
            data:allCourses,
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success:false,
            message:"failed to fetch course",
            error:error.message
        })
    }
}


exports.getCourseDetails = async (req,res)=>{

    try {
        const {courseId}= req.body;

        const courseDetails = await Course.find(
                                        {_id:courseId}
                                                    )
                                        .populate(
                                            {
                                                path:"instructor",
                                                populate:{
                                                    path:"additionalDetails",
                                                }
                                            }
                                        )
                                        .populate("category")
                                        .populate("ratingAndReviews")
                                        .populate({
                                            path:"courseContent",
                                            populate:{
                                                path:"subSection"
                                            }
                                        })
                                        .exec();
                
            if(!courseDetails){
                return res.status(401).json({
                    success:false,
                    message:"could not find course deatils"
                })
            }

			let totalDurationInSeconds = 0
			// courseDetails.courseContent.forEach((content) => {
			//   content.subSection.forEach((subSection) => {
			// 	const timeDurationInSeconds = parseInt(subSection.timeDuration)
			// 	totalDurationInSeconds += timeDurationInSeconds
			//   })
			// })
		
			const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
		
			return res.status(200).json({
			  success: true,
			  data: {
				courseDetails,
				totalDuration,
			  },
			})

            // return res.status(200).json({
            //     success:true,
            //     message:"Course details fetched successfully",
            //     data:courseDetails
            // })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success:false,
            message:"failed to fetch course",
            error:error.message
        })   
    }
}

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
	try {
	  // Get the instructor ID from the authenticated user or request body
	  const instructorId = req.user.id
  
	  // Find all courses belonging to the instructor
	  const instructorCourses = await Course.find({
		instructor: instructorId,
	  }).sort({ createdAt: -1 })
  
	  // Return the instructor's courses
	  res.status(200).json({
		success: true,
		data: instructorCourses,
	  })
	} catch (error) {
	  console.error(error)
	  res.status(500).json({
		success: false,
		message: "Failed to retrieve instructor courses",
		error: error.message,
	  })
	}
  }

// Delete the Course
exports.deleteCourse = async (req, res) => {
	try {
	  const { courseId } = req.body
  
	  // Find the course
	  const course = await Course.findById(courseId)
	  if (!course) {
		return res.status(404).json({ message: "Course not found" })
	  }
  
	  // Unenroll students from the course
	  const studentsEnrolled = course.studentsEnrolled
	  for (const studentId of studentsEnrolled) {
		await User.findByIdAndUpdate(studentId, {
		  $pull: { courses: courseId },
		})
	  }
  
	  // Delete sections and sub-sections
	  const courseSections = course.courseContent
	  for (const sectionId of courseSections) {
		// Delete sub-sections of the section
		const section = await Section.findById(sectionId)
		if (section) {
		  const subSections = section.subSection
		  for (const subSectionId of subSections) {
			await SubSection.findByIdAndDelete(subSectionId)
		  }
		}
  
		// Delete the section
		await Section.findByIdAndDelete(sectionId)
	  }
  
	  // Delete the course
	  await Course.findByIdAndDelete(courseId)
  
	  return res.status(200).json({
		success: true,
		message: "Course deleted successfully",
	  })
	} catch (error) {
	  console.error(error)
	  return res.status(500).json({
		success: false,
		message: "Server error",
		error: error.message,
	  })
	}
  }

exports.getFullCourseDetails = async (req, res) => {
	try {
	  const { courseId } = req.body
	  const userId = req.user.id
	  const courseDetails = await Course.findOne({
		_id: courseId,
	  })
		.populate({
		  path: "instructor",
		  populate: {
			path: "additionalDetails",
		  },
		})
		.populate("category")
		.populate("ratingAndReviews")
		.populate({
		  path: "courseContent",
		  populate: {
			path: "subSection",
		  },
		})
		.exec()
  
	  let courseProgressCount = await CourseProgress.findOne({
		courseID: courseId,
		userId: userId,
	  })
  
	  console.log("courseProgressCount : ", courseProgressCount)
  
	  if (!courseDetails) {
		return res.status(400).json({
		  success: false,
		  message: `Could not find course with id: ${courseId}`,
		})
	  }
  
	  // if (courseDetails.status === "Draft") {
	  //   return res.status(403).json({
	  //     success: false,
	  //     message: `Accessing a draft course is forbidden`,
	  //   });
	  // }
  
	  let totalDurationInSeconds = 0
	  courseDetails.courseContent.forEach((content) => {
		content.subSection.forEach((subSection) => {
		  const timeDurationInSeconds = parseInt(subSection.timeDuration)
		  totalDurationInSeconds += timeDurationInSeconds
		})
	  })
  
	  const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
	  return res.status(200).json({
		success: true,
		data: {
		  courseDetails,
		  totalDuration,
		  completedVideos: courseProgressCount?.completedVideos
			? courseProgressCount?.completedVideos
			: [],
		},
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}
  }