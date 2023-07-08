const Section = require("../models/Section")
const Course = require("../models/Course");
const SubSection=require('../models/Subsection')

exports.createSection = async (req,res)=>{
    try {
        const {sectionName, courseId}= req.body;

        if(!sectionName||!courseId){
            res.status(400).json({
                success:false,
                message:"please send all the required information"
            })
        }
        const newSection = await Section.create({sectionName});

        const updatedCourse = await Course.findByIdAndUpdate(
                                                courseId,
                                                {
                                                    $push:{
                                                        courseContent:newSection._id
                                                    }
                                                },
                                                {new:true}
        )
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec();


        // HW to populate section and subsection details
        console.log(updatedCourse)

        return res.status(200).json({
            success:true,
            message:"message created successfully",
            updatedCourse
        })


    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success:false,
            message:"failed to  section"
        })
    }
}



// exports.updateSection = async (req,res)=>{
//     try {

//         // data input
//         const {sectionName, sectionId}= req.body
//         // validation
//         if(!sectionName||!sectionId){
//             res.status(400).json({
//                 success:false,
//                 message:"please send all the required information"
//             })
//         }

//         // update

//         const updatedSection= await Section.findByIdAndUpdate(
//                                         sectionId,
//                                         {
//                                             sectionName:sectionName
//                                                 },
//                                                 {new:true}
//         )

//         // return response

//         res.status(200).json({
//             success:true,
//             message:"section updated successfully",
//             updatedSection
//         })
        
//     } catch (error) {
//         console.log(error)

//         return res.status(500).json({
//             success:false,
//             message:"failed to update section",
//             error:error
//         })
//     }
// }

exports.updateSection = async (req, res) => {
	try {
		const { sectionName, sectionId,courseId } = req.body;
		const section = await Section.findByIdAndUpdate(
			sectionId,
			{ sectionName },
			{ new: true }
		);

		const course = await Course.findById(courseId)
		.populate({
			path:"courseContent",
			populate:{
				path:"subSection",
			},
		})
		.exec();

		res.status(200).json({
			success: true,
			message: section,
			data:course,
		});
	} catch (error) {
		console.error("Error updating section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};



// exports.deleteSection = async (req,res)=>{
//     try {
        
//         const {sectionId}= req.body

//         await Section.findByIdAndDelete({_id:sectionId})

        
//         res.status(200).json({
//             success:true,
//             message:"section deoeted successfully",
            
//         })


//     } catch (error) {
//         console.log(error)

//         return res.status(500).json({
//             success:false,
//             message:"failed to delete section"
//         })
//     }
    
// }


exports.deleteSection = async (req, res) => {
	try {

		const { sectionId, courseId }  = req.body;
		await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
		const section = await Section.findById(sectionId);
		console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

		//delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

		//find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};   