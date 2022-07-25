const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  paymentMethod: { type: String},
  couponDiscountedPrice:{type:Number,default:0},
  couponPercentage:{type:Number,default:0},
  couponName:{type:String},
  PaidAmount:{type:Number},
  reFund:{type:Number,default:0},
  product: [
    {
      pro_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
      MRP: { type: Number },
      quantity: { type: Number, default: 1,},
      subtotal: {  type: Number,default: 0,},
      orderCancelled:{type:Boolean,default:false},
      orderDelivered:{type:Boolean,default:false},
      productName:{type:String},
      status: { type: String, default: 'Order Placed', },
    },
  ],
  deliveryDetails: {
    fname:String,
    lname: String,
    mobile: String,
    email: String,
    house: String,
    locality: String,
    towncity: String,
    district: String,
    state: String,
    pincode: Number,
  },
  Total: {
    type: Number,
  },
  shippingCharges: {
    type: Number,
  },
  grandTotal: {
    type: Number,
    default: 0,
  },
  ordered_on: {
    type: Date,
  },
  payment_status: {
    type: String,
  },
});

const orderModel = mongoose.model('order', orderSchema);
module.exports = orderModel;
