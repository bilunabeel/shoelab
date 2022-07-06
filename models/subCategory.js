const mongoose = require('mongoose')
const Schema = mongoose.Schema

const subcategorySchema = new Schema({
    Sub_category:String,
    Category:{
        Sub_category:String,
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    }
})

const subcategory = mongoose.model('sub_category',subcategorySchema)
module.exports = subcategory