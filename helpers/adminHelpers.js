const mongoose = require ('mongoose');
const {resolve, reject} = require ('promise');
const adminDatas = require ('../models/adminData');
const couponData = require('../models/coupon');
const orderModel = require('../models/order');
const userdatas = require('../models/user')

module.exports = {
  doAdminLogin: adminData => {
    return new Promise (async (resolve, reject) => {
      const admin = await adminDatas.findOne ({Username: adminData.Username});

      let response = {};

      if (admin) {
        if (adminData.Password == admin.Password) {
          console.log ('Admin Login Success...');
          response.admin = admin;
          response.status = true;
          resolve (response);
        } else {
          console.log ('Admin Login Failed...');
          resolve ({status: false});
        }
      } else {
        console.log ('Admin Login Failed...');
        resolve ({status: false});
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

    return new Promise (async (resolve, reject) => {

      const newCoupon = new couponData ({
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

  getAllCoupons:()=>{
    return new Promise(async(resolve,reject)=>{
        const allCoupons = await couponData.find({}).lean()
        resolve(allCoupons)
    })
  },

  deleteCoupon:(couponId)=>{
    console.log('delete coup helpers');
    return new Promise(async(resolve,reject)=>{
        const deleteCoupon = await couponData.findByIdAndDelete({_id:couponId})
        resolve(deleteCoupon)
    })
  },

  salesReport: (data) => {
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
          $match: { payment_status: "placed" },
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
          $match: { payment_status: "placed" },
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
      let orderCount = await orderModel
        .find({ date: { $gt: d1, $lt: d2 } })
        .count();
      let totalAmounts = await orderModel.aggregate([
        {
          $match: { payment_status: "placed" },
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
          $match: { status: "placed" },
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
      response.totalAmountPaid = totalAmounts.totalAmount;
      response.totalAmountRefund = totalAmountRefund.totalAmount;
      resolve(response);
    });
  },

};
