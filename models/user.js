const mongoose = require('mongoose')
const Schema = mongoose.Schema


const UserSchema = new Schema({
    Firstname:{
        type: String,
        required:true},
    Lastname:{
        type: String,
        required:true
    },
    Mobile:{
        type: Number,
    },
    Email : {
        type: String,
        required:true
    },
    Password:{
        type: String,
        required:true
    },
    block:{
        type:Boolean
    },
    address:[{
        fname:String,
        lname:String,
        house:String,
        towncity:String,
        district:String,
        state:String,
        pincode:Number,
        email:String,
        mobile:Number,
        locality:String
    }],

    created_at :{type:Date, required:true,default:Date.now}
},{timestamps:true})

const user=mongoose.model('user',UserSchema)
module.exports=user