const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  user_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  paymentMethod: {
    type: String,
  },
  product: [
    {
      pro_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
      MRP: {
        type: Number,
      },
      quantity: {
        type: Number,
        default: 1, 
      },
      subtotal: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        default: "Order Placed",
      },
    },
  ],
  deliveryDetails: {
    name: String,
    number: String,
    email: String,
    house: String,
    localPlace: String,
    town: String,
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

const orderModel = mongoose.model("order", orderSchema);
module.exports = orderModel;
