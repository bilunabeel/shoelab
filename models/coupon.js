const mongoose = require('mongoose')
const Schema = mongoose.Schema

const couponCodeSchema = new Schema({
    couponName:{
        type:String,
        min:4,
        max:10,
        trim:true,
        required:true
    },
    couponCode:{
        type:String,
        min:5,
        max:10,
        trim:true,
        required:true,
        unique:true
    },
    limit:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date
    },
    expirationTime:{
        type:Date,
        required:true
    },
    usedUsers:{
        type:Array
    },
    available:{
        type:Boolean
    }
})

const coupon_register = mongoose.model('coupon_register',couponCodeSchema)
module.exports = coupon_register