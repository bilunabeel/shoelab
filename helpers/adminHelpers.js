const mongoose = require ('mongoose');
const {resolve, reject} = require ('promise');
const adminDatas = require ('../models/adminData');
const couponData = require('../models/coupon')
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

};
