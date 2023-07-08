const mongoose = require("mongoose");

const categorySchema =new mongoose.Schema({
 
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        trim:true
    },
    courses:
    [

        {
            // here can be some error
            type:mongoose.Schema.Types.ObjectId,
            ref:"Course"
        }
    ]
})

module.exports = mongoose.model("Category",categorySchema);   