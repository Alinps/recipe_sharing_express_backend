const mongoose = require('mongoose')

const recipeSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    steps:{
        type:String,
        required:true
    },
    "ingredients":{
        type:String,
        required:true
    },
    "cookingTime":{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    difficulty:{
        type:String,
        enum:["easy","medium","hard"]
    },
    "image":{
        type:String,
        required:true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    
},{timestamps:true});

module.exports = mongoose.model("Recipe",recipeSchema);