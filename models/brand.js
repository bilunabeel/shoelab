const mongoose = require('mongoose')
const Schema = mongoose.Schema


const brandSchema = new Schema({
    Brand_Name:String,
    
    created_at :{type:Date, required:true,default:Date.now}
},{timestamps:true})

const brand=mongoose.model('brand',brandSchema)
module.exports=brand