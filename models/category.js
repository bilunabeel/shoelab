const mongoose = require('mongoose')
const Schema = mongoose.Schema


const categorySchema = new Schema({
    Category:String,

    created_at :{type:Date, required:true,default:Date.now}
},{timestamps:true})

const category=mongoose.model('category',categorySchema)
module.exports=category