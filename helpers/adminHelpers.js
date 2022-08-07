const mongoose = require('mongoose');
const { resolve, reject } = require('promise');
const adminDatas = require('../models/adminData');
const couponData = require('../models/coupon');
const orderModel = require('../models/order');
const userdatas = require('../models/user')

module.exports = {
  doAdminLogin: adminData => {
    return new Promise(async (resolve, reject) => {
      const admin = await adminDatas.findOne({ Username: adminData.Username });

      let response = {};

      if (admin) {
        if (adminData.Password == admin.Password) {
          console.log('Admin Login Success...');
          response.admin = admin;
          response.status = true;
          resolve(response);
        } else {
          console.log('Admin Login Failed...');
          resolve({ status: false });
        }
      } else {
        console.log('Admin Login Failed...');
        resolve({ status: false });
      }
    });
  },

  blockUser: (userId) => {
    console.log(userId);

    return new Promise(async (resolve, reject) => {
      const user = await userdatas.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: true } },
        { upsert: true }
      );
      resolve(user);
    });
  },

  unblockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await userdatas.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: false } },
        { upsert: true }
      );
      resolve(user);
    });
  },

  addCoupon: (data) => {

    return new Promise(async (resolve, reject) => {

      const newCoupon = new couponData({
        couponName: data.couponName,
        couponCode: data.couponCode,
        limit: data.limit,
        expirationTime: data.expirationTime,
        discount: data.discount,
      });
      await newCoupon.save()
      resolve()
    });
  },

  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      const allCoupons = await couponData.find({}).lean()
      resolve(allCoupons)
    })
  },

  deleteCoupon: (couponId) => {
    console.log('delete coup helpers');
    return new Promise(async (resolve, reject) => {
      const deleteCoupon = await couponData.findByIdAndDelete({ _id: couponId })
      resolve(deleteCoupon)
    })
  },

  changeOrderStatus: (data) => {
    console.log('data inside helpers');
    console.log(data);
    return new Promise(async (resolve, reject) => {
      let state;
      if(data.orderStatus == 'Delivered'){
        state = await orderModel.findOneAndUpdate(
          {_id:data.orderId, "product._id":data.proId},
          {
            $set:{"product.$.status": data.orderStatus , 'product.$.orderDelivered':true}
          },
        )
      }else{

        state = await orderModel.findOneAndUpdate(
          { _id: data.orderId , "product._id" : data.proId },
          {
            $set: { "product.$.status": data.orderStatus,'product.$.orderDelivered':false }
          }
        )
      }
      
      resolve()
    })
  },

  salesReport: (data) => {
    //console.log('data inside helpers');

    let response = {};
    let { startDate, endDate } = data;
    let d1, d2, text;
    if (!startDate || !endDate) {
      d1 = new Date();
      d1.setDate(d1.getDate() - 7);
      d2 = new Date();
      text = "For the Last 7 days";
    } else {
      d1 = new Date(startDate);
      d2 = new Date(endDate);
      text = `Between ${startDate} and ${endDate}`;
    }
    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });
    return new Promise(async (resolve, reject) => {

      let salesReport = await orderModel.aggregate([
        {
          $match: {
            ordered_on: {
              $lt: d2,
              $gte: d1,
            },
          },
        },
        {
          $match: { payment_status: "Order Placed" },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$ordered_on" },
            total: { $sum: "$grandTotal" },
          },
        },
      ]);

      let brandReport = await orderModel.aggregate([
        {
          $match: { payment_status: "Order Placed" },
        },
        {
          $unwind: "$product",
        },
        {
          $project: {
            brand: "$product.productName",
            quantity: "$product.quantity",
          },
        },

        {
          $group: {
            _id: "$brand",
            totalAmount: { $sum: "$quantity" },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]);

      console.log(brandReport);

      let orderCount = await orderModel
        .find({ date: { $gt: d1, $lt: d2 } })
        .count();

      let totalAmounts = await orderModel.aggregate([
        {
          $match: { payment_status: "Order Placed" },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$grandTotal" },
          },
        },
      ]);

      let totalAmountRefund = await orderModel.aggregate([
        {
          $match: { payment_status: "Order Placed" },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$reFund" },
          },
        },
      ]);
      response.salesReport = salesReport;
      response.brandReport = brandReport;
      response.orderCount = orderCount;
      response.totalAmountPaid = totalAmounts[0].totalAmount;
      response.totalAmountRefund = totalAmountRefund[0].totalAmount;
      console.log(totalAmountRefund[0].totalAmount);
      resolve(response);
    });
  },

};
