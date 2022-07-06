const mongoose = require('mongoose')
const Schema = mongoose.Schema


const productSchema = new Schema({
    Product_Name:String,
    
    MRP:String,
    Discount:String,
    Size:String,
    Stock:String,
    Color:String,
    Category: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    },
    Sub_category: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "sub_category",
        required: true
    },
    Brand: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "brand",
        required: true
    },
    Images: {
        type: Array,
        
    },
    created_at: { type: Date, required: true, default: Date.now }
}, { timestamps: true })

const product = mongoose.model('product', productSchema)
module.exports = product