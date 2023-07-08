const mongoose = require("mongoose");

const subSectionSchema =new mongoose.Schema({
    title:{
        type:String
    },
    timeDuration:{
        type:String
    },
    description:{
        type:String,
        
    },
    videoUrl:{
        // here can be some error
        type:String,
        
    }
})

module.exports = mongoose.model("SubSection",subSectionSchema);